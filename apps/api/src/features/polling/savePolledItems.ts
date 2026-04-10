import { and, eq, inArray } from "drizzle-orm";
import db from "../../db";
import { items } from "../../db/schema";
import type {
  ItemCountsByType,
  NormalizedItemInput,
  SavePolledItemsResult,
} from "./types";

type SavePolledItemsParams = {
  items: NormalizedItemInput[];
};

type ItemInsert = typeof items.$inferInsert;

export async function savePolledItems(
  params: SavePolledItemsParams,
): Promise<SavePolledItemsResult> {
  const inputCount = params.items.length;
  const inputByType = countItemsByType(params.items);

  if (params.items.length < 1) {
    return {
      inputCount,
      skippedCount: 0,
      insertedCount: 0,
      inputByType,
      insertedByType: createEmptyItemCountsByType(),
      skippedByType: createEmptyItemCountsByType(),
    };
  }

  const itemsWithoutDuplicateHnItems = await filterDuplicateHnItems(
    params.items,
  );
  const itemsWithoutDuplicateSubredditItems = await filterDuplicateSubredditItems(
    itemsWithoutDuplicateHnItems,
  );
  const itemsToInsert = await filterDuplicateRssItems(
    itemsWithoutDuplicateSubredditItems,
  );

  if (itemsToInsert.length < 1) {
    return {
      inputCount,
      skippedCount: inputCount,
      insertedCount: 0,
      inputByType,
      insertedByType: createEmptyItemCountsByType(),
      skippedByType: inputByType,
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
  const insertedByType = countItemsByType(rows.map((row) => ({ sourceType: row.type })));

  return {
    inputCount,
    skippedCount: inputCount - rows.length,
    insertedCount: rows.length,
    inputByType,
    insertedByType,
    skippedByType: {
      rss: inputByType.rss - insertedByType.rss,
      subreddit: inputByType.subreddit - insertedByType.subreddit,
      hn: inputByType.hn - insertedByType.hn,
    },
  };
}

function createEmptyItemCountsByType(): ItemCountsByType {
  return {
    rss: 0,
    subreddit: 0,
    hn: 0,
  };
}

function countItemsByType(
  itemsToCount: Array<Pick<NormalizedItemInput, "sourceType"> | { sourceType: "rss" | "subreddit" | "hn" }>,
): ItemCountsByType {
  const counts = createEmptyItemCountsByType();

  for (const item of itemsToCount) {
    counts[item.sourceType] += 1;
  }

  return counts;
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

  const newHnItems: NormalizedItemInput[] = [];

  for (const item of hnCandidates) {
    if (item.externalId && existingExternalIds.has(item.externalId)) {
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
      continue;
    }

    newSubredditItems.push(item);
  }

  return [...nonSubredditItems, ...newSubredditItems];
}

async function filterDuplicateRssItems(itemsToCheck: NormalizedItemInput[]) {
  const uniqueRssUrlsInBatch = new Set<string>();
  const rssCandidates: NormalizedItemInput[] = [];
  const nonRssItems: NormalizedItemInput[] = [];

  for (const item of itemsToCheck) {
    if (item.sourceType !== "rss") {
      nonRssItems.push(item);
      continue;
    }

    if (uniqueRssUrlsInBatch.has(item.url)) {
      continue;
    }

    uniqueRssUrlsInBatch.add(item.url);
    rssCandidates.push(item);
  }

  if (rssCandidates.length < 1) {
    return nonRssItems;
  }

  const urls = rssCandidates.map((item) => item.url);

  const existingRssItems = await db
    .select({ url: items.url })
    .from(items)
    .where(and(eq(items.type, "rss"), inArray(items.url, urls)));

  const existingUrls = new Set(existingRssItems.map((item) => item.url));

  const newRssItems: NormalizedItemInput[] = [];

  for (const item of rssCandidates) {
    if (existingUrls.has(item.url)) {
      continue;
    }

    newRssItems.push(item);
  }

  return [...nonRssItems, ...newRssItems];
}
