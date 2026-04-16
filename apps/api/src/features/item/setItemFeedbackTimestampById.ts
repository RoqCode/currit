import db from "../../db";
import { itemFeedback } from "../../db/schema";

type FeedbackTimestampField = "likedAt" | "bookmarkedAt" | "readAt";

type ItemFeedbackInsert = typeof itemFeedback.$inferInsert;

export default async function setItemFeedbackTimestampById(
  id: string,
  field: FeedbackTimestampField,
  nextState: boolean,
) {
  const nextTimestamp = nextState ? new Date() : null;

  const insertValues: ItemFeedbackInsert = {
    itemId: id,
    [field]: nextTimestamp,
  };

  const updateValues: Pick<ItemFeedbackInsert, FeedbackTimestampField> = {
    [field]: nextTimestamp,
  };

  const rows = await db
    .insert(itemFeedback)
    .values(insertValues)
    .onConflictDoUpdate({
      target: itemFeedback.itemId,
      set: updateValues,
    })
    .returning();

  return rows[0] ?? null;
}
