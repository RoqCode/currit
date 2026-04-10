import { parseFeed } from "feedsmith";
import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import {
  normalizeAtomEntry,
  normalizeFeedItems,
  normalizeRdfItem,
  normalizeRssItem,
  type NormalizedFeedItemsResult,
} from "./rssNormalization";
import { isAbortError, PollingError } from "../../shared/errors";
import validateSourceUrl, {
  InvalidSourceUrlError,
} from "../sources/validateSourceUrl";

export type FetchRssFeedResult = NormalizedFeedItemsResult;

export async function fetchRssFeed(
  sourceUrl: string,
): Promise<FetchRssFeedResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const validatedSourceUrl = validateSourceUrl(sourceUrl, "rss");

    const res = await fetch(validatedSourceUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": buildUserAgent(),
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.1",
      },
    });

    if (!res.ok) {
      throw new PollingError(
        "http_error",
        `RSS fetch failed with HTTP ${res.status}`,
      );
    }

    const contentType = res.headers.get("content-type");
    const xml = await res.text();

    return parseFeedItems({
      xml,
      sourceUrl: validatedSourceUrl,
      contentType,
    });
  } catch (err) {
    if (isAbortError(err)) {
      throw new PollingError("network_error", "RSS request timed out");
    }

    if (err instanceof PollingError) {
      throw err;
    }

    if (err instanceof InvalidSourceUrlError) {
      throw new PollingError("unknown_error", err.message);
    }

    throw new PollingError(
      "parse_error",
      err instanceof Error ? err.message : `Unexpected RSS polling error: ${err}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseFeedItems(params: {
  xml: string;
  sourceUrl: string;
  contentType: string | null;
}): FetchRssFeedResult {
  let parsedFeed: ReturnType<typeof parseFeed>;

  try {
    parsedFeed = parseFeed(params.xml);
  } catch (error) {
    throw new PollingError(
      "parse_error",
      buildRssParseErrorMessage({
        sourceUrl: params.sourceUrl,
        contentType: params.contentType,
        body: params.xml,
        error,
      }),
    );
  }

  if (parsedFeed.format === "rss") {
    return normalizeFeedItems(parsedFeed.feed.items ?? [], normalizeRssItem);
  }

  if (parsedFeed.format === "atom") {
    return normalizeFeedItems(parsedFeed.feed.entries ?? [], normalizeAtomEntry);
  }

  if (parsedFeed.format === "rdf") {
    return normalizeFeedItems(parsedFeed.feed.items ?? [], normalizeRdfItem);
  }

  throw new PollingError(
    "parse_error",
    `Unsupported feed format for RSS source: ${parsedFeed.format}`,
  );
}

function buildRssParseErrorMessage(params: {
  sourceUrl: string;
  contentType: string | null;
  body: string;
  error: unknown;
}) {
  const details = [
    `RSS parse failed for ${params.sourceUrl}`,
    params.contentType ? `(content-type ${params.contentType})` : "(content-type unknown)",
    `: ${getErrorMessage(params.error)}`,
  ].join(" ");

  const bodyPreview = getBodyPreview(params.body);

  return bodyPreview ? `${details} | body preview: ${bodyPreview}` : details;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

function getBodyPreview(body: string) {
  const normalizedBody = body.replace(/\s+/g, " ").trim();

  if (!normalizedBody) {
    return null;
  }

  const truncatedBody = normalizedBody.slice(0, 220);

  return normalizedBody.length > truncatedBody.length
    ? `${truncatedBody}…`
    : truncatedBody;
}
