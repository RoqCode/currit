import { eq } from "drizzle-orm";
import db from "../db";
import { sourcesTable } from "../db/schema";

export async function deleteSourceById(id: string) {
  const rows = await db
    .delete(sourcesTable)
    .where(eq(sourcesTable.id, id))
    .returning({ id: sourcesTable.id });

  return rows[0] ?? null;
}
