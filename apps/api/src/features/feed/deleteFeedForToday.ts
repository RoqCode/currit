import { eq } from "drizzle-orm";
import db from "../../db";
import { feedItems, feeds } from "../../db/schema";
import { getTodayBounds } from "../../shared/getTodayBounds";

export async function deleteFeedForToday() {
  const { feedDate } = getTodayBounds();

  const existingFeeds = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(eq(feeds.feedDate, feedDate));

  if (existingFeeds.length < 1) {
    return { deletedFeedCount: 0, deletedFeedItemCount: 0 };
  }

  return db.transaction(async (tx) => {
    let deletedFeedItemCount = 0;

    for (const feed of existingFeeds) {
      const deletedFeedItems = await tx
        .delete(feedItems)
        .where(eq(feedItems.feedId, feed.id))
        .returning({ itemId: feedItems.itemId });

      deletedFeedItemCount += deletedFeedItems.length;
    }

    const deletedFeeds = await tx
      .delete(feeds)
      .where(eq(feeds.feedDate, feedDate))
      .returning({ id: feeds.id });

    return {
      deletedFeedCount: deletedFeeds.length,
      deletedFeedItemCount,
    };
  });
}
