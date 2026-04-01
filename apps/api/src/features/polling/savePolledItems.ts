import { and, eq, inArray } from "drizzle-orm";
import db from "../../db";
import { items } from "../../db/schema";
import type { NormalizedItemInput } from "./types";

type SavePolledItemsParams = {
  items: NormalizedItemInput[];
};

type ItemInsert = typeof items.$inferInsert;

export async function savePolledItems(
  params: SavePolledItemsParams,
): Promise<void> {
  // TODO: Return enough information for the caller to build a source-level summary.
  if (params.items.length < 1) {
    return;
  }

  const itemsToInsert = await filterDuplicateHnItems(params.items);

  if (itemsToInsert.length < 1) {
    console.log("0 items inserted");
    console.log("0 of type 'rss'");
    console.log("0 of type 'subreddit'");
    console.log("0 of type 'hnItems'");
    return;
  }

  const itemRows = itemsToInsert.map((item) => ({
    sourceId: item.sourceId,
    type: item.sourceType,
    externalId: item.externalId ?? null,
    title: item.title,
    description: item.description,
    url: item.url,
    publishedAt: item.publishedAt,
    fetchedAt: item.fetchedAt ?? new Date(),
    itemScore: item.itemScore ?? 0,
    commentCount: item.commentCount ?? 0,
    author: item.author ?? null,
  })) satisfies ItemInsert[];

  const rows = await db.insert(items).values(itemRows).returning();

  const rssItems = rows.filter((item) => item.type === "rss");
  const redditItems = rows.filter((item) => item.type === "subreddit");
  const hnItems = rows.filter((item) => item.type === "hn");

  console.log(`${rows.length} items inserted`);
  console.log(`${rssItems.length} of type 'rss'`);
  console.log(`${redditItems.length} of type 'subreddit'`);
  console.log(`${hnItems.length} of type 'hnItems'`);
}

async function filterDuplicateHnItems(itemsToCheck: NormalizedItemInput[]) {
  const uniqueHnIdsInBatch = new Set<string>();
  const hnCandidates: NormalizedItemInput[] = [];
  const nonHnItems: NormalizedItemInput[] = [];

  for (const item of itemsToCheck) {
    if (item.sourceType !== "hn") {
      nonHnItems.push(item);
      continue;
    }

    if (!item.externalId) {
      hnCandidates.push(item);
      continue;
    }

    if (uniqueHnIdsInBatch.has(item.externalId)) {
      continue;
    }

    uniqueHnIdsInBatch.add(item.externalId);
    hnCandidates.push(item);
  }

  if (hnCandidates.length < 1) {
    return nonHnItems;
  }

  const externalIds = hnCandidates
    .map((item) => item.externalId)
    .filter((externalId): externalId is string => Boolean(externalId));

  if (externalIds.length < 1) {
    return [...nonHnItems, ...hnCandidates];
  }

  const existingHnItems = await db
    .select({ externalId: items.externalId })
    .from(items)
    .where(and(eq(items.type, "hn"), inArray(items.externalId, externalIds)));

  const existingExternalIds = new Set(
    existingHnItems
      .map((item) => item.externalId)
      .filter((externalId): externalId is string => Boolean(externalId)),
  );

  const newHnItems = hnCandidates.filter(
    (item) => !item.externalId || !existingExternalIds.has(item.externalId),
  );

  return [...nonHnItems, ...newHnItems];
}
