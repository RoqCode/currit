import { and, eq, ne } from "drizzle-orm";
import db from "../../db";
import { sources } from "../../db/schema";

export async function deleteSourceById(id: string) {
  const rows = await db
    .delete(sources)
    .where(and(eq(sources.id, id), ne(sources.isBuiltin, true)))
    .returning({ id: sources.id });

  return rows[0] ?? null;
}
