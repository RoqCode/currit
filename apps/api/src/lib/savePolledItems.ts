import db from "../db";
import type { NormalizedItemInput, SavePolledItemsResult } from "./pollTypes";

type SavePolledItemsParams = {
  sourceId: string;
  items: NormalizedItemInput[];
};

export async function savePolledItems(
  params: SavePolledItemsParams,
): Promise<SavePolledItemsResult> {
  // TODO: Persist normalized items into the items table.
  // In the current RSS flow this will usually be either zero or one item.
  // TODO: Optionally guard against duplicate source/url combinations before insert.
  // TODO: Return enough information for the caller to build a source-level summary.
  void db;
  void params;
  throw new Error("TODO: implement savePolledItems");
}
