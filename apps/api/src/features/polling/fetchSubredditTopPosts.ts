import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import isRecord from "@currit/shared/utils/isRecord";
import { NormalizedSubredditItem } from "./types";
import { isAbortError, PollingError } from "../../shared/errors";

type SubredditPostKind =
  | "self"
  | "external_link"
  | "image"
  | "video"
  | "unknown";

export default async function fetchSubredditTopPosts(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const normalizedUrl = url.endsWith("/") ? url : `${url}/`;

  try {
    const res = await fetch(
      `${normalizedUrl}top.json?t=day&limit=20&raw_json=1`,
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": buildUserAgent(),
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) {
      throw new PollingError(
        "http_error",
        `Subreddit fetch failed with HTTP ${res.status}`,
      );
    }

    const jsonBody = await res.json();

    const topItems = parseTopItems(jsonBody);

    return topItems;
  } catch (e) {
    if (isAbortError(e)) {
      throw new PollingError("network_error", "Subreddit request timed out");
    }

    if (e instanceof PollingError) {
      throw e;
    }

    throw new PollingError(
      "unknown_error",
      `Unexpected subreddit polling error for ${url}: ${e}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseTopItems(body: unknown) {
  const parsedItems: NormalizedSubredditItem[] = [];

  if (!isRecord(body)) return [];
  if (!isRecord(body.data)) return [];
  if (!Array.isArray(body.data.children)) return [];

  for (const wrappedItem of body.data.children) {
    if (!isRecord(wrappedItem)) continue;
    if (!isRecord(wrappedItem.data)) continue;
    const item = wrappedItem.data;

    let author: string | null = null;
    let id: number | string = 0;
    let score: number | null = null;
    let description: string | null = null;
    let publishedAt: Date | null = null;
    let title: string | null = null;
    let url: string | null = null;

    if ("author" in item && typeof item.author === "string") {
      author = item.author;
    }

    if (
      "id" in item &&
      (typeof item.id === "string" || typeof item.id === "number")
    ) {
      id = item.id;
    }

    if ("score" in item && typeof item.score === "number") {
      score = item.score;
    }

    if ("created_utc" in item && typeof item.created_utc === "number") {
      publishedAt = new Date(item.created_utc * 1000);
    }

    if ("title" in item && typeof item.title === "string") {
      title = item.title;
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
    } satisfies NormalizedSubredditItem);
  }

  return parsedItems;
}

function getPostKind(item: Record<string, unknown>): SubredditPostKind {
  if (item.is_self === true) return "self";
  if (item.is_video === true) return "video";
  if (item.post_hint === "image") return "image";

  if (
    item.post_hint === "link" ||
    ("url_overridden_by_dest" in item &&
      typeof item.url_overridden_by_dest === "string")
  ) {
    return "external_link";
  }

  return "unknown";
}

function getDescription(
  item: Record<string, unknown>,
  postKind: SubredditPostKind,
) {
  if (
    "selftext" in item &&
    typeof item.selftext === "string" &&
    item.selftext
  ) {
    return item.selftext;
  }

  if (postKind === "image") return "Image post on Reddit.";
  if (postKind === "video") return "Video post on Reddit.";

  if (postKind === "external_link") {
    if ("domain" in item && typeof item.domain === "string") {
      return `External link to ${item.domain}.`;
    }

    return "External link post.";
  }

  return null;
}

function getUrl(item: Record<string, unknown>, postKind: SubredditPostKind) {
  if (
    postKind === "external_link" &&
    "url_overridden_by_dest" in item &&
    typeof item.url_overridden_by_dest === "string"
  ) {
    return item.url_overridden_by_dest;
  }

  if ("permalink" in item && typeof item.permalink === "string") {
    return `https://www.reddit.com${item.permalink}`;
  }

  if ("url" in item && typeof item.url === "string") {
    return item.url;
  }

  return "https://www.reddit.com";
}
