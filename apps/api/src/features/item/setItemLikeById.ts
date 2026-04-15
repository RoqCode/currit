import db from "../../db";
import { itemFeedback } from "../../db/schema";

export default async function setItemLikeById(
  id: string,
  newLikeState: boolean,
) {
  const likedAt = newLikeState ? new Date() : null;

  const rows = await db
    .insert(itemFeedback)
    .values({
      itemId: id,
      likedAt,
    })
    .onConflictDoUpdate({
      target: itemFeedback.itemId,
      set: {
        likedAt,
      },
    })
    .returning();

  return rows[0] ?? null;
}
