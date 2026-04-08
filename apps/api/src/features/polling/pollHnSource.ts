import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import type { NormalizedItemInput } from "./types";

export default async function pollHnSource(
  sourceId: string,
  itemId: number,
): Promise<NormalizedItemInput | null> {
  let item: unknown;

  try {
    item = await fetchHnItem(itemId);
  } catch (error) {
    console.error("error while fetching hackernews item", error, itemId);
    return null;
  }

  if (!item) return null;

  return parseHnItem(sourceId, item);
}

async function fetchHnItem(id: number | string): Promise<Response> {
  const res = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
    {
      method: "GET",
      signal: AbortSignal.timeout(5_000),
      headers: {
        "User-Agent": buildUserAgent(),
        Accept: "application/json",
      },
    },
  );

  if (!res.ok)
    throw new Error(`Fetch for item ${id} failed with status ${res.status}`);

  const item = await res.json();

  return item;
}

function parseHnItem(sourceId: string, item: unknown) {
  if (!isRecord(item)) return null;

  let author: string | null = null;
  let id: number | string = 0;
  let score: number | null = null;
  let description: string | null = null;
  let publishedAt: Date | null = null;
  let title: string | null = null;
  let url: string | null = null;

  if ("by" in item && typeof item.by === "string") {
    author = item.by;
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

  if ("text" in item && typeof item.text === "string") {
    description = item.text;
  }

  if ("time" in item && typeof item.time === "number") {
    publishedAt = new Date(item.time * 1000);
  }

  if ("title" in item && typeof item.title === "string") {
    title = item.title;
  }

  if ("url" in item && typeof item.url === "string") {
    url = item.url;
  }

  return {
    sourceId,
    externalId: String(id),
    title: title ?? "unknown title",
    description,
    url: `https://news.ycombinator.com/item?id=${id}`,
    publishedAt: publishedAt ?? new Date(Date.now()),
    author,
    itemScore: score,
    sourceType: "hn",
  } satisfies NormalizedItemInput;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
