import db from "../../db";
import { items } from "../../db/schema";
import type { NormalizedItemInput } from "./types";

type SavePolledItemsParams = {
  items: NormalizedItemInput[];
};

type ItemInsert = typeof items.$inferInsert;

export async function savePolledItems(
  params: SavePolledItemsParams,
): Promise<void> {
  // TODO: guard against duplicate source/url combinations before insert.
  // TODO: Return enough information for the caller to build a source-level summary.

  const itemRows = params.items.map((item) => ({
    sourceId: item.sourceId,
    type: item.sourceType,
    title: item.title,
    description: item.description,
    url: item.url,
    publishedAt: item.publishedAt,
    fetchedAt: item.fetchedAt ?? new Date(),
    itemScore: item.itemScore ?? 0,
    commentCount: item.commentCount ?? 0,
    author: item.author ?? null,
  })) satisfies ItemInsert[];

  const rows = await db.insert(items).values(itemRows).returning();

  const rssItems = rows.filter((item) => item.type === "rss");
  const redditItems = rows.filter((item) => item.type === "subreddit");
  const hnItems = rows.filter((item) => item.type === "hn");

  console.log(`${rows.length} items inserted`);
  console.log(`${rssItems.length} of type 'rss'`);
  console.log(`${redditItems.length} of type 'subreddit'`);
  console.log(`${hnItems.length} of type 'hnItems'`);
}
