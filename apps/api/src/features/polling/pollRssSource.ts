import { getAllSources } from "../sources/getAllSources";
import { fetchRssFeed } from "./fetchRssFeed";
import type { NormalizedRSSItem, PollSourceResult } from "./types";
import { updateSource } from "../sources/updateSource";
import { PollingError } from "../../shared/errors";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

export async function pollRssSource(
  source: SourceRow,
): Promise<PollSourceResult> {
  const start = performance.now();

  let feedItems: NormalizedRSSItem[];
  try {
    feedItems = await fetchRssFeed(source.url);
  } catch (err) {
    if (err instanceof PollingError) {
      return {
        status: "error",
        errorMessage: err.message,
        errorType: err.code,
        sourceId: source.id,
        sourceName: source.name,
        sourceType: "rss",
        durationMs: performance.now() - start,
      };
    }

    throw err;
  }

  const now = new Date(Date.now());

  let newFeedItems: NormalizedRSSItem[];

  if (source.lastCollectedFrom) {
    newFeedItems = feedItems.filter(
      (item) => item.publishedAt > source.lastCollectedFrom!,
    );
  } else {
    const newestItem = feedItems.reduce<(typeof feedItems)[number] | null>(
      (newest, item) => {
        if (!newest || item.publishedAt > newest.publishedAt) {
          return item;
        }

        return newest;
      },
      null,
    );

    newFeedItems = newestItem ? [newestItem] : [];
  }

  if (newFeedItems.length < 1) {
    await updateSource({
      sourceId: source.id,
      lastPolledFrom: now,
    });

    return {
      status: "success",
      items: [],
      fetchedCount: feedItems.length,
      sourceId: source.id,
      sourceName: source.name,
      sourceType: "rss",
      durationMs: performance.now() - start,
    };
  }

  const newestCollectedItem = newFeedItems.reduce<
    (typeof newFeedItems)[number]
  >((newest, item) => {
    if (item.publishedAt > newest.publishedAt) {
      return item;
    }

    return newest;
  }, newFeedItems[0]);

  await updateSource({
    sourceId: source.id,
    lastPolledFrom: now,
    lastCollectedFrom: newestCollectedItem.publishedAt,
  });

  return {
    status: "success",
    fetchedCount: feedItems.length,
    sourceId: source.id,
    sourceName: source.name,
    sourceType: "rss",
    durationMs: performance.now() - start,
    items: newFeedItems.map((item) => ({
      sourceId: source.id,
      sourceType: "rss",
      title: item.title,
      url: item.url,
      description: item.description,
      publishedAt: item.publishedAt,
      fetchedAt: now,
      author: item.author,
    })),
  };
}
