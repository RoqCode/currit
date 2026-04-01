import { eq } from "drizzle-orm";
import db from "../db";
import { feedItems, feeds, items } from "../db/schema";
import { getTodayBounds } from "./getTodayBounds";

export default async function getFeed() {
  const { feedDate } = getTodayBounds();

  const [feed] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.feedDate, feedDate))
    .limit(1);

  if (!feed) {
    return null;
  }

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
