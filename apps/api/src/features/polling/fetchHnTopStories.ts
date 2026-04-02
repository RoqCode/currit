import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import { NormalizedHnItem } from "./types";

export default async function fetchHnTopStories(): Promise<NormalizedHnItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
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
      throw new Error(`HTTP ${res.status}`);
    }

    const jsonBody = await res.json();
    const topStoryIds = (jsonBody as number[]).slice(0, 20);

    const results = await Promise.allSettled(
      topStoryIds.map((id) => fetchHnItem(id)),
    );

    const items = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    return parseHnItems(items);
  } catch (e) {
    console.error("error while fetching hackernews topstories", e);
    // TODO: handle error
  } finally {
    clearTimeout(timeout);
  }

  return [];
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

function parseHnItems(items: unknown[]) {
  const parsedItems: NormalizedHnItem[] = [];

  for (const item of items) {
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

    parsedItems.push({
      id,
      title: title ?? "unknown title",
      description,
      url: `https://news.ycombinator.com/item?id=${id}`,
      publishedAt: publishedAt ?? new Date(Date.now()),
      author,
      score,
    } satisfies NormalizedHnItem);
  }

  return parsedItems;
}
