import db from "../../db";
import { sources } from "../../db/schema";

export async function getAllSources() {
  const rows = await db.select().from(sources);

  return rows;
}
