import { desc, eq, isNotNull } from "drizzle-orm";
import db from "../../db";
import { items, itemFeedback, sources } from "../../db/schema";

export default async function getBookmarked() {
  const rows = db
    .select({
      item: items,
      sourceName: sources.name,
      feedback: {
        bookmarkedAt: itemFeedback.bookmarkedAt,
        likedAt: itemFeedback.likedAt,
        readAt: itemFeedback.readAt,
      },
    })
    .from(itemFeedback)
    .innerJoin(items, eq(itemFeedback.itemId, items.id))
    .leftJoin(sources, eq(items.sourceId, sources.id))
    .where(isNotNull(itemFeedback.bookmarkedAt))
    .orderBy(desc(itemFeedback.bookmarkedAt));

  return rows;
}
