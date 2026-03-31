import { eq } from "drizzle-orm";
import db from "../db";
import { feedItems, feeds, items } from "../db/schema";

export default async function getFeed() {
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const feedDate = startOfDay.toISOString().slice(0, 10);

  const [feed] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.feedDate, feedDate))
    .limit(1);

  const rows = await db
    .select({
      position: feedItems.position,
      bucket: feedItems.bucket,
      scoreAtSelection: feedItems.scoreAtSelection,
      item: items,
    })
    .from(feedItems)
    .innerJoin(items, eq(feedItems.itemId, items.id))
    .where(eq(feedItems.feedId, feed.id))
    .orderBy(feedItems.position);

  return {
    id: feed.id,
    feedDate: feed.feedDate,
    items: rows.map((row) => ({
      position: row.position,
      bucket: row.bucket,
      scoreAtSelection: row.scoreAtSelection,
      ...row.item,
    })),
  };
}
