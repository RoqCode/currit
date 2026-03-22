import db from "../db";
import { sourcesTable } from "../db/schema";

export async function getAllSources() {
  const rows = await db.select().from(sourcesTable);

  return rows;
}
