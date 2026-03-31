import { eq, and, gte, desc, sql } from "drizzle-orm";
import db from "../db";
import { items, feeds, feedItems } from "../db/schema";

export default async function buildFeed() {
  // For testing:
  // get 2 subreddit items with highest scores with createdAt today
  // get 2 hn items with highest scores
  // get 1 random rss feed item
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const feedDate = startOfDay.toISOString().slice(0, 10);

  // subreddit items
  const redditRows = await db
    .select()
    .from(items)
    .where(and(eq(items.type, "subreddit"), gte(items.createdAt, startOfDay)))
    .orderBy(desc(items.itemScore))
    .limit(2);

  // hn items
  const hnRows = await db
    .select()
    .from(items)
    .where(and(eq(items.type, "hn"), gte(items.createdAt, startOfDay)))
    .orderBy(desc(items.itemScore))
    .limit(2);

  // rss items
  const rssRows = await db
    .select()
    .from(items)
    .where(and(eq(items.type, "rss"), gte(items.createdAt, startOfDay)))
    .orderBy(sql`random()`)
    .limit(1);

  const selectedItems = [...redditRows, ...hnRows, ...rssRows];

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
}
