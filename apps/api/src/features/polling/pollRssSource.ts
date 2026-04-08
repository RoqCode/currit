import { getAllSources } from "../sources/getAllSources";
import { fetchRssFeed } from "./fetchRssFeed";
import type { NormalizedItemInput, NormalizedRSSItem } from "./types";
import { updateSource } from "../sources/updateSource";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

export async function pollRssSource(
  source: SourceRow,
): Promise<NormalizedItemInput[] | null> {
  const feedItems = await fetchRssFeed(source.url);
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

    return null;
  }

  if (!source.lastCollectedFrom || newFeedItems.length >= 1) {
    await updateSource({
      sourceId: source.id,
      lastPolledFrom: now,
      lastCollectedFrom: now,
    });

    return newFeedItems.map((item) => ({
      sourceId: source.id,
      sourceType: "rss",
      title: item.title,
      url: item.url,
      description: item.description,
      publishedAt: item.publishedAt,
      fetchedAt: now,
      author: item.author,
    }));
  } else {
    await updateSource({
      sourceId: source.id,
      lastPolledFrom: now,
    });
    return null;
  }
}
