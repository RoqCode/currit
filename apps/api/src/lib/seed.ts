import db from "../db";
import { sources } from "../db/schema";

export async function seedDB() {
  const inserts = [];

  for (let i = 0; i < 20; i++) {
    inserts.push({
      url: `url-${i}`,
      name: `name-${i}`,
    });
  }

  await db.insert(sources).values(inserts);
}
