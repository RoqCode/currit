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

type ItemUpdate = {
  externalId: string;
  type: "rss" | "subreddit" | "hn";
  itemScore: number | null;
  commentCount: number | null;
  lastObserved: Date;
  id: string;
};

type ExistingItemRow = {
  id: string;
  type: "rss" | "subreddit" | "hn";
  externalId: string | null;
  itemScore?: number | null;
  commentCount?: number | null;
  url?: string;
};

type ExistingItemsByIdentity = {
  redditRowsByExternalId: Map<string, ExistingItemRow>;
  hnRowsByExternalId: Map<string, ExistingItemRow>;
  rssRowsByUrl: Map<string, ExistingItemRow>;
};

type PartitionedItemsForPersistence = {
  itemsToInsert: NormalizedItemInput[];
  itemsToUpdate: Array<{
    item: NormalizedItemInput;
    existingItem: ExistingItemRow;
  }>;
  skippedItems: NormalizedItemInput[];
};

type EngagementUpdateRule = {
  minScoreDelta: number;
  minHealthyRatio: number;
  minRatioRetention: number;
  maxCommentPressure: number;
  minTotalScore: number;
  minTotalComments: number;
};

const ENGAGEMENT_UPDATE_RULES: Record<
  "subreddit" | "hn",
  EngagementUpdateRule
> = {
  subreddit: {
    minScoreDelta: 8,
    minHealthyRatio: 3.5,
    minRatioRetention: 0.7,
    maxCommentPressure: 1.25,
    minTotalScore: 25,
    minTotalComments: 8,
  },
  hn: {
    minScoreDelta: 5,
    minHealthyRatio: 2.0,
    minRatioRetention: 0.45,
    maxCommentPressure: 2.5,
    minTotalScore: 15,
    minTotalComments: 12,
  },
};

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
      updatedCount: 0,
      inputByType,
      insertedByType: createEmptyItemCountsByType(),
      updatedByType: createEmptyItemCountsByType(),
      skippedByType: createEmptyItemCountsByType(),
    };
  }

  const candidateItems = dedupeIncomingItems(params.items);

  if (candidateItems.length < 1) {
    return {
      inputCount,
      skippedCount: inputCount,
      insertedCount: 0,
      updatedCount: 0,
      inputByType,
      insertedByType: createEmptyItemCountsByType(),
      updatedByType: createEmptyItemCountsByType(),
      skippedByType: inputByType,
    };
  }

  const existingItems = await loadExistingItemsByIdentity(candidateItems);

  const { itemsToInsert, itemsToUpdate, skippedItems } =
    partitionItemsForPersistence(candidateItems, existingItems);

  const insertRows = itemsToInsert.map((item) => ({
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
    lastObserved: new Date(),
  })) satisfies ItemInsert[];

  const insertedRows = await db.insert(items).values(insertRows).returning();
  const insertedByType = countItemsByType(
    insertedRows.map((row) => ({ sourceType: row.type })),
  );

  const updateRows = itemsToUpdate.map((item) => ({
    externalId: item.item.externalId!,
    itemScore: item.item.itemScore ?? 0,
    commentCount: item.item.commentCount ?? 0,
    lastObserved: new Date(),
    id: item.existingItem.id,
    type: item.item.sourceType,
  })) satisfies ItemUpdate[];

  let updatedRows: ItemInsert[] = [];
  for (const row of updateRows) {
    const updatedRow = await db
      .update(items)
      .set({
        itemScore: row.itemScore,
        commentCount: row.commentCount,
        lastObserved: row.lastObserved,
      })
      .where(and(eq(items.type, row.type), eq(items.id, row.id)))
      .returning();
    updatedRows.push(...updatedRow);
  }

  const updatedByType = countItemsByType(
    updatedRows.map((updatedRows) => ({ sourceType: updatedRows.type })),
  );

  const updatedCount = updatedRows.length;
  const insertedCount = insertedRows.length;
  const skippedCount = skippedItems.length;

  return {
    inputCount,
    skippedCount,
    insertedCount,
    updatedCount,
    inputByType,
    insertedByType,
    updatedByType,
    skippedByType: countItemsByType(skippedItems),
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
  itemsToCount: Array<
    | Pick<NormalizedItemInput, "sourceType">
    | { sourceType: "rss" | "subreddit" | "hn" }
  >,
): ItemCountsByType {
  const counts = createEmptyItemCountsByType();

  for (const item of itemsToCount) {
    counts[item.sourceType] += 1;
  }

  return counts;
}

function dedupeIncomingItems(items: NormalizedItemInput[]) {
  const uniqueItemsInBatch = new Set<string>();
  const candidates: NormalizedItemInput[] = [];

  for (const item of items) {
    if (item.sourceType === "rss") {
      if (uniqueItemsInBatch.has(item.url)) {
        continue;
      } else {
        uniqueItemsInBatch.add(item.url);
        candidates.push(item);
      }
    } else {
      if (!item.externalId) {
        candidates.push(item);
        continue;
      }

      if (uniqueItemsInBatch.has(item.externalId)) {
        continue;
      }

      uniqueItemsInBatch.add(item.externalId);
      candidates.push(item);
    }
  }

  return candidates;
}

async function loadExistingItemsByIdentity(
  candidates: NormalizedItemInput[],
): Promise<ExistingItemsByIdentity> {
  const redditCandidateIds: string[] = [],
    hnCandidateIds: string[] = [],
    rssCandidateUrls: string[] = [];

  for (const candidate of candidates) {
    switch (candidate.sourceType) {
      case "subreddit":
        redditCandidateIds.push(candidate.externalId!);
        break;
      case "hn":
        hnCandidateIds.push(candidate.externalId!);
        break;
      case "rss":
        rssCandidateUrls.push(candidate.url);
      default:
        break;
    }
  }

  const redditRows = redditCandidateIds.length
    ? await db
        .select({
          id: items.id,
          type: items.type,
          externalId: items.externalId,
          itemScore: items.itemScore,
          commentCount: items.commentCount,
        })
        .from(items)
        .where(
          and(
            eq(items.type, "subreddit"),
            inArray(items.externalId, redditCandidateIds),
          ),
        )
    : [];

  const redditRowsByExternalId = new Map<string, ExistingItemRow>(
    redditRows.flatMap((row) =>
      row.externalId === null ? [] : ([[row.externalId, row]] as const),
    ),
  );

  const hnRows = hnCandidateIds.length
    ? await db
        .select({
          id: items.id,
          type: items.type,
          externalId: items.externalId,
          itemScore: items.itemScore,
          commentCount: items.commentCount,
        })
        .from(items)
        .where(
          and(eq(items.type, "hn"), inArray(items.externalId, hnCandidateIds)),
        )
    : [];

  const hnRowsByExternalId = new Map<string, ExistingItemRow>(
    hnRows.flatMap((row) =>
      row.externalId === null ? [] : ([[row.externalId, row]] as const),
    ),
  );

  const rssRows = rssCandidateUrls.length
    ? await db
        .select({
          id: items.id,
          type: items.type,
          externalId: items.externalId,
          url: items.url,
        })
        .from(items)
        .where(and(eq(items.type, "rss"), inArray(items.url, rssCandidateUrls)))
    : [];

  const rssRowsByUrl = new Map<string, ExistingItemRow>(
    rssRows
      .filter((row): row is ExistingItemRow & { url: string } =>
        Boolean(row.url),
      )
      .map((row) => [row.url, row]),
  );

  return {
    redditRowsByExternalId,
    hnRowsByExternalId,
    rssRowsByUrl,
  };
}

function partitionItemsForPersistence(
  items: NormalizedItemInput[],
  existing: ExistingItemsByIdentity,
): PartitionedItemsForPersistence {
  const itemsToInsert: NormalizedItemInput[] = [];
  const itemsToUpdate: PartitionedItemsForPersistence["itemsToUpdate"] = [];
  const skippedItems: NormalizedItemInput[] = [];

  for (const item of items) {
    if (item.sourceType === "rss") {
      const existingRssItem = existing.rssRowsByUrl.get(item.url);

      if (existingRssItem) {
        skippedItems.push(item);
        continue;
      }
    }

    if (item.sourceType === "hn") {
      if (!item.externalId) {
        itemsToInsert.push(item);
        continue;
      }

      const existingHnItem = existing.hnRowsByExternalId.get(item.externalId!);

      if (existingHnItem) {
        if (shouldUpdateExistingItem(item, existingHnItem)) {
          itemsToUpdate.push({ item, existingItem: existingHnItem });
        } else {
          skippedItems.push(item);
        }

        continue;
      }
    }

    if (item.sourceType === "subreddit") {
      if (!item.externalId) {
        itemsToInsert.push(item);
        continue;
      }

      const existingSubredditItem = existing.redditRowsByExternalId.get(
        item.externalId,
      );

      if (existingSubredditItem) {
        if (shouldUpdateExistingItem(item, existingSubredditItem)) {
          itemsToUpdate.push({ item, existingItem: existingSubredditItem });
        } else {
          skippedItems.push(item);
        }

        continue;
      }
    }

    itemsToInsert.push(item);
  }

  return {
    itemsToInsert,
    itemsToUpdate,
    skippedItems,
  };
}

function shouldUpdateExistingItem(
  item: NormalizedItemInput,
  existingItem: ExistingItemRow,
) {
  if (item.sourceType === "rss") {
    return false;
  }

  const rules = ENGAGEMENT_UPDATE_RULES[item.sourceType];
  const previousScore = existingItem.itemScore ?? 0;
  const nextScore = item.itemScore ?? 0;
  const previousComments = existingItem.commentCount ?? 0;
  const nextComments = item.commentCount ?? 0;

  const scoreDelta = nextScore - previousScore;
  const commentDelta = nextComments - previousComments;

  if (scoreDelta < rules.minScoreDelta || commentDelta < 0) {
    return false;
  }

  const hasEnoughSignal =
    nextScore >= rules.minTotalScore || nextComments >= rules.minTotalComments;

  if (!hasEnoughSignal) {
    return false;
  }

  const previousRatio = previousScore / Math.max(previousComments, 1);
  const nextRatio = nextScore / Math.max(nextComments, 1);
  const ratioRetention = nextRatio / Math.max(previousRatio, 0.1);
  const commentPressure = commentDelta / Math.max(scoreDelta, 1);

  return (
    nextRatio >= rules.minHealthyRatio &&
    ratioRetention >= rules.minRatioRetention &&
    commentPressure <= rules.maxCommentPressure
  );
}
