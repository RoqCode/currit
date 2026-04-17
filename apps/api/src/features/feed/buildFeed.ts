import { and, eq, gte, notExists, sql } from "drizzle-orm";
import db from "../../db";
import { items, feeds, feedItems, type ItemRow } from "../../db/schema";
import { getTodayBounds } from "../../shared/getTodayBounds";
import { getCandidateWindow } from "../../shared/getCandidateWindow";
import scoreCandidates, { ScoredItemRow } from "./scoreCandidates";

const candidateWindowDays = 4;

const numRedditSlots = 4;
const numHnSlots = 4;
const numRssSlots = 4;

const maxPerSource = 2;
const maxPerHnSource = numHnSlots;

// Experiment flags for ranking behavior:
// - scoreBucketsSeparately: score Reddit and HN in isolated pools vs one shared pool
// - selectBucketsSeparately: fill fixed Reddit/HN slots vs let both compete for the same slots
const feedSelectionConfig = {
  scoreBucketsSeparately: true,
  selectBucketsSeparately: true,
};

type SelectedItemRow = ItemRow | ScoredItemRow;

async function selectItemsForToday() {
  const { startOfWindow } = getCandidateWindow(candidateWindowDays);

  const redditRows = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.type, "subreddit"),
        gte(items.createdAt, startOfWindow),
        notExists(
          db.select().from(feedItems).where(eq(feedItems.itemId, items.id)),
        ),
      ),
    );

  const hnRows = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.type, "hn"),
        gte(items.createdAt, startOfWindow),
        notExists(
          db.select().from(feedItems).where(eq(feedItems.itemId, items.id)),
        ),
      ),
    );

  const rssRows = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.type, "rss"),
        gte(items.createdAt, startOfWindow),
        notExists(
          db.select().from(feedItems).where(eq(feedItems.itemId, items.id)),
        ),
      ),
    )
    .orderBy(sql`random()`)
    .limit(numRssSlots);

  const { redditCandidates, hnCandidates } = getScoredCandidates({
    redditRows,
    hnRows,
  });

  const scoredSelections = feedSelectionConfig.selectBucketsSeparately
    ? [
        ...fillSlots(redditCandidates, numRedditSlots, maxPerSource),
        ...fillSlots(hnCandidates, numHnSlots, maxPerHnSource),
      ]
    : fillSlots(
        [...redditCandidates, ...hnCandidates],
        numRedditSlots + numHnSlots,
        maxPerSource,
      );

  return [...scoredSelections, ...rssRows].sort(() => Math.random() - 0.5);
}

function getScoredCandidates({
  redditRows,
  hnRows,
}: {
  redditRows: ItemRow[];
  hnRows: ItemRow[];
}) {
  if (feedSelectionConfig.scoreBucketsSeparately) {
    return {
      redditCandidates: scoreCandidates(redditRows),
      hnCandidates: scoreCandidates(hnRows),
    };
  }

  const combinedCandidates = scoreCandidates([...redditRows, ...hnRows]);

  return {
    redditCandidates: combinedCandidates.filter(
      (item) => item.type === "subreddit",
    ),
    hnCandidates: combinedCandidates.filter((item) => item.type === "hn"),
  };
}

function fillSlots(
  candidates: ScoredItemRow[],
  limit: number,
  maxItemsPerSource: number,
) {
  const available = [...candidates];
  const feedItems: ScoredItemRow[] = [];
  const sourceCounts = new Map<string, number>();

  while (feedItems.length < limit) {
    const eligible = [];
    for (const item of available) {
      if (!item.sourceId) continue;
      if ((sourceCounts.get(item.sourceId) ?? 0) < maxItemsPerSource) {
        eligible.push(item);
      }
    }
    if (eligible.length < 1) return feedItems;

    const totalWeight = eligible.reduce(
      (sum, item) => sum + item.samplingWeight,
      0,
    );

    let remainingWeight = Math.random() * totalWeight;
    let pickedItem: ScoredItemRow | undefined;

    for (const item of eligible) {
      remainingWeight -= item.samplingWeight;
      if (remainingWeight <= 0) {
        pickedItem = item;
        break;
      }
    }

    if (!pickedItem) return feedItems;

    feedItems.push(pickedItem);

    sourceCounts.set(
      pickedItem.sourceId!,
      (sourceCounts.get(pickedItem.sourceId!) ?? 0) + 1,
    );

    const pickedIndex = available.findIndex(
      (item) => item.id === pickedItem.id,
    );

    if (pickedIndex !== -1) {
      available.splice(pickedIndex, 1);
    }
  }

  return feedItems;
}

export default async function buildFeed() {
  const { feedDate } = getTodayBounds();
  const { feedDateRange } = getCandidateWindow(candidateWindowDays);
  const selectedItems = await selectItemsForToday();

  logSelectedItemsDebug(selectedItems);

  const feed = await db.transaction(async (tx) => {
    const [feedRow] = await tx
      .insert(feeds)
      .values({
        feedDate,
      })
      .returning();

    const feedItemRows = selectedItems.map((item, index) => ({
      feedId: feedRow.id,
      itemId: item.id,
      position: index + 1,
      bucket: item.type,
      scoreAtSelection: item.itemScore ?? null,
    }));

    if (feedItemRows.length > 0) {
      await tx.insert(feedItems).values(feedItemRows);
    }

    return feedRow;
  });

  console.log(
    `feed created with id ${feed.id} for date ${feed.feedDate}. Feed has ${selectedItems.length} items from candidate range ${feedDateRange}`,
  );

  return {
    feed,
    selectedItemCount: selectedItems.length,
  };
}

function logSelectedItemsDebug(items: SelectedItemRow[]) {
  for (const item of items) {
    console.log("feed item picked", {
      itemId: item.id,
      sourceId: item.sourceId,
      type: item.type,
      title: item.title,
      itemScore: item.itemScore,
      commentCount: item.commentCount,
      createdAt: item.createdAt.toISOString(),
      isScoredCandidate: isScoredItem(item),
      ageHours: isScoredItem(item) ? Number(item.ageHours.toFixed(2)) : null,
      localScore: isScoredItem(item)
        ? Number(item.localScore.toFixed(4))
        : null,
      globalScore: isScoredItem(item)
        ? Number(item.globalScore.toFixed(4))
        : null,
      preDecayScore: isScoredItem(item)
        ? Number(item.preDecayScore.toFixed(4))
        : null,
      freshnessMultiplier: isScoredItem(item)
        ? Number(item.freshnessMultiplier.toFixed(4))
        : null,
      normalizedScore: isScoredItem(item)
        ? Number(item.normalizedScore.toFixed(4))
        : null,
      samplingWeight: isScoredItem(item)
        ? Number(item.samplingWeight.toFixed(4))
        : null,
    });
  }
}

function isScoredItem(item: SelectedItemRow): item is ScoredItemRow {
  return "samplingWeight" in item;
}
