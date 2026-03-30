import { getAllSources } from "./getAllSources";
import { fetchRssFeed } from "./fetchRssFeed";
import type { PollSourceResult } from "./pollTypes";
import { savePolledItems } from "./savePolledItems";
import { updateSourceLastPolledAt } from "./updateSourceLastPolledAt";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

type PollRssSourceParams = {
  source: SourceRow;
};

export async function pollRssSource(
  params: PollRssSourceParams,
): Promise<PollSourceResult> {
  // TODO: Poll exactly one RSS source.

  const feedItems = await fetchRssFeed(params.source.url);

  const newestFeedItem = feedItems.reduce<(typeof feedItems)[number] | null>(
    (newest, item) => {
      if (!newest || item.publishedAt > newest.publishedAt) {
        return item;
      }

      return newest;
    },
    null,
  );

  console.dir(newestFeedItem, { depth: 0 });

  // TODO: Fetch and parse the feed, then determine the newest item with a valid publishedAt.
  // TODO: If source.lastCollectedFrom is null, save that newest item and set lastCollectedFrom.
  // TODO: If source.lastCollectedFrom exists, only save the newest item when it is newer.
  // TODO: Ignore items without a usable publication date instead of inventing a fallback timestamp.
  // TODO: Update lastPolledAt after a successful poll, even when no new item was inserted.
  // TODO: Catch and classify source-specific failures instead of letting them escape.
  // TODO: Return insertedCount/skippedCount based on the latest-item-only flow.
  void updateSourceLastPolledAt;
  void params;
  throw new Error("TODO: implement pollRssSource");
}
