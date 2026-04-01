import { eq } from "drizzle-orm";
import db from "../../db";
import { sources } from "../../db/schema";

export async function deleteSourceById(id: string) {
  const rows = await db
    .delete(sources)
    .where(eq(sources.id, id))
    .returning({ id: sources.id });

  return rows[0] ?? null;
}
