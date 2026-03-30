import db from "../db";
import { sources } from "../db/schema";

export async function createSource(name: string, url: string) {
  await db.insert(sources).values({ name: name, url: url });
}
