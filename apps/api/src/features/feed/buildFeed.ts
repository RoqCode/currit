import { and, desc, eq, gte, sql } from "drizzle-orm";
import db from "../../db";
import { items, feeds, feedItems } from "../../db/schema";
import { getTodayBounds } from "../../shared/getTodayBounds";

async function selectItemsForToday() {
  const { startOfDay } = getTodayBounds();

  const redditRows = await db
    .select()
    .from(items)
    .where(and(eq(items.type, "subreddit"), gte(items.createdAt, startOfDay)))
    .orderBy(desc(items.itemScore))
    .limit(2);

  const hnRows = await db
    .select()
    .from(items)
    .where(and(eq(items.type, "hn"), gte(items.createdAt, startOfDay)))
    .orderBy(desc(items.itemScore))
    .limit(2);

  const rssRows = await db
    .select()
    .from(items)
    .where(and(eq(items.type, "rss"), gte(items.createdAt, startOfDay)))
    .orderBy(sql`random()`)
    .limit(2);

  return [...redditRows, ...hnRows, ...rssRows];
}

export default async function buildFeed() {
  const { feedDate } = getTodayBounds();
  const selectedItems = await selectItemsForToday();

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
    `feed created with id ${feed.id} for date ${feed.feedDate}. Feed has ${selectedItems.length} items`,
  );

  return {
    feed,
    selectedItemCount: selectedItems.length,
  };
}
