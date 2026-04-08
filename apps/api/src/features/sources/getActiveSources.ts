import db from "../../db";
import { sources } from "../../db/schema";
import { eq } from "drizzle-orm";

export async function getActiveSources() {
  const rows = await db.select().from(sources).where(eq(sources.active, true));

  return rows;
}
