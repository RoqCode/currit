import db from "../../db";
import { sources } from "../../db/schema";

export async function clearSources() {
  await db.delete(sources);
}
