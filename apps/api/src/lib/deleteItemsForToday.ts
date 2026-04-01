import { and, gte, lt } from "drizzle-orm";
import db from "../db";
import { items } from "../db/schema";
import { getTodayBounds } from "./getTodayBounds";

export async function deleteItemsForToday() {
  const { startOfDay, endOfDay } = getTodayBounds();

  const deletedItems = await db
    .delete(items)
    .where(and(gte(items.createdAt, startOfDay), lt(items.createdAt, endOfDay)))
    .returning({ id: items.id });

  return {
    deletedItemCount: deletedItems.length,
  };
}
