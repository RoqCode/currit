import { desc, eq, isNotNull } from "drizzle-orm";
import db from "../../db";
import { items, itemFeedback } from "../../db/schema";

export default async function getBookmarked() {
  const rows = db
    .select({
      item: items,
      feedback: {
        bookmarkedAt: itemFeedback.bookmarkedAt,
        likedAt: itemFeedback.likedAt,
        readAt: itemFeedback.readAt,
      },
    })
    .from(itemFeedback)
    .innerJoin(items, eq(itemFeedback.itemId, items.id))
    .where(isNotNull(itemFeedback.bookmarkedAt))
    .orderBy(desc(itemFeedback.bookmarkedAt));

  return rows;
}
