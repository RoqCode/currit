import { eq } from "drizzle-orm";
import db from "../db";
import { sources } from "../db/schema";

type UpdateSourceParams = {
  sourceId: string;
  lastPolledFrom: Date;
  lastCollectedFrom?: Date;
};

export async function updateSource(params: UpdateSourceParams): Promise<void> {
  await db
    .update(sources)
    .set({
      lastPolledAt: params.lastPolledFrom,
      ...(params.lastCollectedFrom
        ? { lastCollectedFrom: params.lastCollectedFrom }
        : {}),
    })
    .where(eq(sources.id, params.sourceId));
}
