import { eq } from "drizzle-orm";
import db from "../../db";
import { sources } from "../../db/schema";

export default async function setSourceActiveById(
  id: string,
  newActiveState: boolean,
) {
  const rows = await db
    .update(sources)
    .set({
      active: newActiveState,
    })
    .where(eq(sources.id, id))
    .returning();

  if (!rows[0]) return null;

  return rows[0];
}
