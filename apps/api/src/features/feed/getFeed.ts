import { eq } from "drizzle-orm";
import db from "../../db";
import { feedItems, feeds, itemFeedback, items } from "../../db/schema";
import { getTodayBounds } from "../../shared/getTodayBounds";

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

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
      feedback: {
        likedAt: itemFeedback.likedAt,
        bookmarkedAt: itemFeedback.bookmarkedAt,
        readAt: itemFeedback.readAt,
      },
    })
    .from(feedItems)
    .innerJoin(items, eq(feedItems.itemId, items.id))
    .leftJoin(itemFeedback, eq(itemFeedback.itemId, items.id))
    .where(eq(feedItems.feedId, feed.id))
    .orderBy(feedItems.position);

  return {
    id: feed.id,
    feedDate: toIsoString(feed.feedDate),
    items: rows.map((row) => ({
      position: row.position,
      bucket: row.bucket,
      scoreAtSelection: row.scoreAtSelection,
      ...row.item,
      publishedAt: toIsoString(row.item.publishedAt),
      fetchedAt: toIsoString(row.item.fetchedAt),
      createdAt: toIsoString(row.item.createdAt),
      lastObserved: row.item.lastObserved
        ? toIsoString(row.item.lastObserved)
        : null,
      feedback: {
        likedAt: row.feedback?.likedAt
          ? toIsoString(row.feedback.likedAt)
          : null,
        bookmarkedAt: row.feedback?.bookmarkedAt
          ? toIsoString(row.feedback.bookmarkedAt)
          : null,
        readAt: row.feedback?.readAt ? toIsoString(row.feedback.readAt) : null,
      },
    })),
  };
}
