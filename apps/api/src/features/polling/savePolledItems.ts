import { and, eq, inArray } from "drizzle-orm";
import db from "../../db";
import { items } from "../../db/schema";
import type { NormalizedItemInput, SavePolledItemsResult } from "./types";

type SavePolledItemsParams = {
  items: NormalizedItemInput[];
};

type ItemInsert = typeof items.$inferInsert;

export async function savePolledItems(
  params: SavePolledItemsParams,
): Promise<SavePolledItemsResult> {
  const inputCount = params.items.length;

  if (params.items.length < 1) {
    return {
      skippedCount: 0,
      insertedCount: 0,
    };
  }

  const itemsWithoutDuplicateHnItems = await filterDuplicateHnItems(
    params.items,
  );
  const itemsToInsert = await filterDuplicateSubredditItems(
    itemsWithoutDuplicateHnItems,
  );

  if (itemsToInsert.length < 1) {
    return {
      skippedCount: inputCount,
      insertedCount: 0,
    };
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

  return {
    skippedCount: inputCount - rows.length,
    insertedCount: rows.length,
  };
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
      console.log(
        `Skipped item of type 'hn' with id ${item.externalId} : duplicate in batch`,
      );
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

  const newHnItems: NormalizedItemInput[] = [];

  for (const item of hnCandidates) {
    if (item.externalId && existingExternalIds.has(item.externalId)) {
      console.log(
        `Skipped item of type 'hn' with id ${item.externalId} : already in db`,
      );
      continue;
    }

    newHnItems.push(item);
  }

  return [...nonHnItems, ...newHnItems];
}

async function filterDuplicateSubredditItems(
  itemsToCheck: NormalizedItemInput[],
) {
  const uniqueSubredditIdsInBatch = new Set<string>();
  const subredditCandidates: NormalizedItemInput[] = [];
  const nonSubredditItems: NormalizedItemInput[] = [];

  for (const item of itemsToCheck) {
    if (item.sourceType !== "subreddit") {
      nonSubredditItems.push(item);
      continue;
    }

    if (!item.externalId) {
      subredditCandidates.push(item);
      continue;
    }

    if (uniqueSubredditIdsInBatch.has(item.externalId)) {
      console.log(
        `Skipped item of type 'subreddit' with id ${item.externalId} : duplicate in batch`,
      );
      continue;
    }

    uniqueSubredditIdsInBatch.add(item.externalId);
    subredditCandidates.push(item);
  }

  if (subredditCandidates.length < 1) {
    return nonSubredditItems;
  }

  const externalIds = subredditCandidates
    .map((item) => item.externalId)
    .filter((externalId): externalId is string => Boolean(externalId));

  if (externalIds.length < 1) {
    return [...nonSubredditItems, ...subredditCandidates];
  }

  const existingSubredditItems = await db
    .select({ externalId: items.externalId })
    .from(items)
    .where(
      and(eq(items.type, "subreddit"), inArray(items.externalId, externalIds)),
    );

  const existingExternalIds = new Set(
    existingSubredditItems
      .map((item) => item.externalId)
      .filter((externalId): externalId is string => Boolean(externalId)),
  );

  const newSubredditItems: NormalizedItemInput[] = [];

  for (const item of subredditCandidates) {
    if (item.externalId && existingExternalIds.has(item.externalId)) {
      console.log(
        `Skipped item of type 'subreddit' with id ${item.externalId} : already in db`,
      );
      continue;
    }

    newSubredditItems.push(item);
  }

  return [...nonSubredditItems, ...newSubredditItems];
}
