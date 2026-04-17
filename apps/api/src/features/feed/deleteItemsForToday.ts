import { and, gte, inArray, lt } from "drizzle-orm";
import db from "../../db";
import { itemFeedback, items } from "../../db/schema";
import { getTodayBounds } from "../../shared/getTodayBounds";

export async function deleteItemsForToday() {
  const { startOfDay, endOfDay } = getTodayBounds();

  return db.transaction(async (tx) => {
    const itemsForToday = await tx
      .select({ id: items.id })
      .from(items)
      .where(and(gte(items.createdAt, startOfDay), lt(items.createdAt, endOfDay)));

    if (itemsForToday.length < 1) {
      return {
        deletedItemCount: 0,
      };
    }

    const itemIds = itemsForToday.map((item) => item.id);

    await tx.delete(itemFeedback).where(inArray(itemFeedback.itemId, itemIds));

    const deletedItems = await tx
      .delete(items)
      .where(inArray(items.id, itemIds))
      .returning({ id: items.id });

    return {
      deletedItemCount: deletedItems.length,
    };
  });
}
