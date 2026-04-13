import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import { z } from "zod";
import type { NormalizedItemInput } from "./types";

const hnItemSchema = z.object({
  by: z.string().nullish(),
  id: z.union([z.string(), z.number()]).optional(),
  score: z.number().nullish(),
  text: z.string().nullish(),
  time: z.number().nullish(),
  title: z.string().nullish(),
  url: z.string().nullish(),
  descendants: z.number().nullish(),
});

type HnItem = z.infer<typeof hnItemSchema>;

export default async function pollHnSource(
  sourceId: string,
  itemId: number,
): Promise<NormalizedItemInput | null> {
  let item: unknown;

  try {
    item = await fetchHnItem(itemId);
  } catch (error) {
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
  const parsedItem = hnItemSchema.safeParse(item);

  if (!parsedItem.success) return null;

  const parsedHnItem = parsedItem.data;

  let author: string | null = null;
  let id: number | string = 0;
  let score: number | null = null;
  let description: string | null = null;
  let publishedAt: Date | null = null;
  let title: string | null = null;
  let url: string | null = null;
  let commentCount: number = 0;

  if (typeof parsedHnItem.by === "string") {
    author = parsedHnItem.by;
  }

  if (
    typeof parsedHnItem.id === "string" ||
    typeof parsedHnItem.id === "number"
  ) {
    id = parsedHnItem.id;
  }

  if (typeof parsedHnItem.score === "number") {
    score = parsedHnItem.score;
  }

  if (typeof parsedHnItem.text === "string") {
    description = parsedHnItem.text;
  }

  if (typeof parsedHnItem.time === "number") {
    publishedAt = new Date(parsedHnItem.time * 1000);
  }

  if (typeof parsedHnItem.title === "string") {
    title = parsedHnItem.title;
  }

  if (typeof parsedHnItem.url === "string") {
    url = parsedHnItem.url;
  }

  if (typeof parsedHnItem.descendants === "number") {
    commentCount = parsedHnItem.descendants;
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
    commentCount,
  } satisfies NormalizedItemInput;
}
