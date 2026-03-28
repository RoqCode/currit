import db from "../db";
import { sourcesTable } from "../db/schema";

export async function clearSources() {
  await db.delete(sourcesTable);
}
