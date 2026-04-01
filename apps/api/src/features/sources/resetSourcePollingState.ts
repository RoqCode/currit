import db from "../../db";
import { sources } from "../../db/schema";

export async function resetSourcePollingState() {
  const resetSources = await db
    .update(sources)
    .set({
      lastPolledAt: null,
      lastCollectedFrom: null,
    })
    .returning({ id: sources.id });

  return {
    resetSourceCount: resetSources.length,
  };
}
