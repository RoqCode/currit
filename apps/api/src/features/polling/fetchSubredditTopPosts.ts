import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import { z } from "zod";
import { NormalizedSubredditItem } from "./types";
import { isAbortError, PollingError } from "../../shared/errors";
import validateSourceUrl, {
  InvalidSourceUrlError,
} from "../sources/validateSourceUrl";

type SubredditPostKind =
  | "self"
  | "external_link"
  | "image"
  | "video"
  | "unknown";

const REDDIT_CONCURRENCY_LIMIT = 5;

type RedditRateLimitInfo = {
  used: number | null;
  remaining: number | null;
  resetSeconds: number | null;
  shouldStopPolling: boolean;
};

const redditPostDataSchema = z.object({
  author: z.string().nullish(),
  id: z.union([z.string(), z.number()]).optional(),
  score: z.number().nullish(),
  created_utc: z.number().nullish(),
  title: z.string().nullish(),
  is_self: z.boolean().optional(),
  is_video: z.boolean().optional(),
  post_hint: z.string().nullish(),
  url_overridden_by_dest: z.string().nullish(),
  selftext: z.string().nullish(),
  domain: z.string().nullish(),
  permalink: z.string().nullish(),
  num_comments: z.number().nullish(),
  url: z.string().nullish(),
});

const redditListingSchema = z.object({
  data: z.object({
    children: z.array(z.object({ data: z.unknown() })),
  }),
});

type RedditPostData = z.infer<typeof redditPostDataSchema>;

export default async function fetchSubredditTopPosts(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const normalizedUrl = `${validateSourceUrl(url, "subreddit")}/`;

    const res = await fetch(
      `${normalizedUrl}top.json?t=day&limit=20&raw_json=1`,
      {
        method: "GET",
        signal: controller.signal,
        redirect: "error",
        headers: {
          "User-Agent": buildUserAgent(),
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) {
      if (res.status === 429) {
        const rateLimit = parseRateLimitHeaders(res.headers);
        throw new PollingError(
          "rate_limit_error",
          buildRateLimitMessage(res.status, rateLimit),
        );
      }

      throw new PollingError(
        "http_error",
        `Subreddit fetch failed with HTTP ${res.status}`,
      );
    }

    const rateLimit = parseRateLimitHeaders(res.headers);

    const jsonBody = await res.json();

    const topItems = parseTopItems(jsonBody);

    return {
      items: topItems,
      rateLimit,
    };
  } catch (e) {
    if (isAbortError(e)) {
      throw new PollingError("network_error", "Subreddit request timed out");
    }

    if (e instanceof PollingError) {
      throw e;
    }

    if (e instanceof InvalidSourceUrlError) {
      throw new PollingError("unknown_error", e.message);
    }

    throw new PollingError(
      "unknown_error",
      `Unexpected subreddit polling error for ${url}: ${e}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseRateLimitHeaders(headers: Headers): RedditRateLimitInfo {
  const used = parseHeaderNumber(headers.get("x-ratelimit-used"));
  const remaining = parseHeaderNumber(headers.get("x-ratelimit-remaining"));
  const resetSeconds = parseHeaderNumber(headers.get("x-ratelimit-reset"));

  return {
    used,
    remaining,
    resetSeconds,
    shouldStopPolling:
      remaining !== null && remaining < REDDIT_CONCURRENCY_LIMIT,
  };
}

function parseHeaderNumber(value: string | null): number | null {
  if (value === null) return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function buildRateLimitMessage(status: number, rateLimit: RedditRateLimitInfo) {
  const remaining =
    rateLimit.remaining === null ? "unknown" : rateLimit.remaining.toString();
  const resetSeconds =
    rateLimit.resetSeconds === null
      ? "unknown"
      : rateLimit.resetSeconds.toString();

  return `Subreddit fetch failed with HTTP ${status} due to Reddit rate limit (remaining ${remaining}, reset ${resetSeconds}s)`;
}

function parseTopItems(body: unknown) {
  const parsedItems: NormalizedSubredditItem[] = [];
  const parsedListing = redditListingSchema.safeParse(body);

  if (!parsedListing.success) return [];

  for (const wrappedItem of parsedListing.data.data.children) {
    const parsedItem = redditPostDataSchema.safeParse(wrappedItem.data);

    if (!parsedItem.success) continue;

    const item = parsedItem.data;

    let author: string | null = null;
    let id: number | string = 0;
    let score: number | null = null;
    let description: string | null = null;
    let publishedAt: Date | null = null;
    let title: string | null = null;
    let url: string | null = null;
    let commentCount: number = 0;

    if (typeof item.author === "string") {
      author = item.author;
    }

    if (typeof item.id === "string" || typeof item.id === "number") {
      id = item.id;
    }

    if (typeof item.score === "number") {
      score = item.score;
    }

    if (typeof item.created_utc === "number") {
      publishedAt = new Date(item.created_utc * 1000);
    }

    if (typeof item.title === "string") {
      title = item.title;
    }

    if (typeof item.num_comments === "number") {
      commentCount = item.num_comments;
    }

    const postKind = getPostKind(item);

    description = getDescription(item, postKind);
    url = getUrl(item, postKind);

    parsedItems.push({
      id,
      title: title ?? "unknown title",
      description,
      url,
      publishedAt: publishedAt ?? new Date(Date.now()),
      author,
      score,
      commentCount,
    } satisfies NormalizedSubredditItem);
  }

  return parsedItems;
}

function getPostKind(item: RedditPostData): SubredditPostKind {
  if (item.is_self === true) return "self";
  if (item.is_video === true) return "video";
  if (item.post_hint === "image") return "image";

  if (
    item.post_hint === "link" ||
    typeof item.url_overridden_by_dest === "string"
  ) {
    return "external_link";
  }

  return "unknown";
}

function getDescription(item: RedditPostData, postKind: SubredditPostKind) {
  if (typeof item.selftext === "string" && item.selftext) {
    return item.selftext;
  }

  if (postKind === "image") return "Image post on Reddit.";
  if (postKind === "video") return "Video post on Reddit.";

  if (postKind === "external_link") {
    if (typeof item.domain === "string") {
      return `External link to ${item.domain}.`;
    }

    return "External link post.";
  }

  return null;
}

function getUrl(item: RedditPostData, postKind: SubredditPostKind) {
  if (
    postKind === "external_link" &&
    typeof item.url_overridden_by_dest === "string"
  ) {
    return item.url_overridden_by_dest;
  }

  if (typeof item.permalink === "string") {
    return `https://www.reddit.com${item.permalink}`;
  }

  if (typeof item.url === "string") {
    return item.url;
  }

  return "https://www.reddit.com";
}
