import { XMLParser } from "fast-xml-parser";
import type { NormalizedItemInput, NormalizedRSSItem } from "./pollTypes";
import buildUserAgent from "@currit/shared/utils/buildUserAgent";

export async function fetchRssFeed(
  sourceUrl: string,
): Promise<NormalizedRSSItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(sourceUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": buildUserAgent(),
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.1",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
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
  } catch (e) {
    console.error("error while fetching url", sourceUrl, e);
    // TODO: handle error
  } finally {
    clearTimeout(timeout);
  }

  throw new Error("TODO: implement fetchRssFeed");
}

function getRssItems(parsedXmlFeed: unknown): NormalizedRSSItem[] {
  if (!("rss" in parsedXmlFeed)) {
    console.warn("no rss field found in response");
    return [];
  }

  const rss = parsedXmlFeed.rss;
  if (!("channel" in rss)) {
    console.warn("no channel field found in response");
    return [];
  }

  const channel = rss.channel;
  if (!("item" in channel)) {
    console.warn("no item field found in response");
    return [];
  }

  const items: unknown[] = [];
  if (Array.isArray(channel.item)) {
    items.push(...channel.item);
  } else if (channel.item) {
    items.push(channel.item);
  }

  const normalizedItems: NormalizedRSSItem[] = [];
  for (const item of items) {
    let author: string | null = "";
    let title: string = "";
    let description: string | null = "";
    let url: string = "";
    let publishedAt: Date = new Date();

    if ("dc:creator" in item && typeof item["dc:creator"] === "string") {
      author = item["dc:creator"];
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
