import db from "../db";

type UpdateSourceLastPolledAtParams = {
  sourceId: string;
};

export async function updateSourceLastPolledAt(
  params: UpdateSourceLastPolledAtParams,
): Promise<void> {
  // TODO: Update the source row to reflect a successful poll timestamp.
  // TODO: Keep lastCollectedFrom updates separate, because they only change when a newer item is stored.
  void db;
  void params;
  throw new Error("TODO: implement updateSourceLastPolledAt");
}
