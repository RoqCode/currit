import { XMLParser } from "fast-xml-parser";
import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import isRecord from "@currit/shared/utils/isRecord";
import type { NormalizedRSSItem } from "./types";
import { isAbortError, PollingError } from "../../shared/errors";
import validateSourceUrl, {
  InvalidSourceUrlError,
} from "../sources/validateSourceUrl";

export async function fetchRssFeed(
  sourceUrl: string,
): Promise<NormalizedRSSItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const validatedSourceUrl = validateSourceUrl(sourceUrl, "rss");

    const res = await fetch(validatedSourceUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "error",
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

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      processEntities: {
        enabled: true,
        maxTotalExpansions: 10_000,
        maxEntityCount: 1_000,
        maxEntitySize: 50_000,
        maxExpandedLength: 500_000,
      },
    });

    const xml = await res.text();

    const parsed = parser.parse(xml);

    const items = getRssItems(parsed);

    return items;
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
      "unknown_error",
      `Unexpected RSS polling error: ${err}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function getRssItems(parsedXmlFeed: unknown): NormalizedRSSItem[] {
  if (!isRecord(parsedXmlFeed)) {
    throw new PollingError("parse_error", "RSS response is not an object");
  }

  if (!("rss" in parsedXmlFeed)) {
    throw new PollingError("parse_error", "RSS response has no rss field");
  }

  const rss = parsedXmlFeed.rss;
  if (!isRecord(rss)) {
    throw new PollingError("parse_error", "RSS field is not an object");
  }

  if (!("channel" in rss)) {
    throw new PollingError("parse_error", "RSS response has no channel field");
  }

  const channel = rss.channel;
  if (!isRecord(channel)) {
    throw new PollingError("parse_error", "RSS channel field is not an object");
  }

  if (!("item" in channel)) {
    throw new PollingError("parse_error", "RSS item field is not present");
  }

  const items: unknown[] = [];
  if (Array.isArray(channel.item)) {
    items.push(...channel.item);
  } else if (channel.item) {
    items.push(channel.item);
  }

  const normalizedItems: NormalizedRSSItem[] = [];
  for (const item of items) {
    if (!isRecord(item)) continue;

    let author: string | null = "";
    let title: string = "";
    let description: string | null = "";
    let url: string = "";
    let publishedAt: Date = new Date();

    if ("dc:creator" in item && typeof item["dc:creator"] === "string") {
      author = item["dc:creator"];
    } else if ("author" in item && typeof item.author === "string") {
      author = item.author;
    } else {
      author = null;
    }

    if ("title" in item && typeof item.title === "string") {
      title = item.title;
    }

    if ("description" in item && typeof item.description === "string") {
      description = item.description;
    } else {
      description = null;
    }

    if ("link" in item && typeof item.link === "string") {
      url = item.link;
    }

    if ("pubDate" in item && typeof item.pubDate === "string") {
      const parsedPublishedAt = new Date(item.pubDate);

      if (!Number.isNaN(parsedPublishedAt.getTime())) {
        publishedAt = parsedPublishedAt;
      }
    }

    normalizedItems.push({ title, description, url, publishedAt, author });
  }

  return normalizedItems;
}
