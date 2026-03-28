import db from "../db";
import { sourcesTable } from "../db/schema";

export async function createSource(name: string, url: string) {
  await db.insert(sourcesTable).values({ name: name, url: url });
}
