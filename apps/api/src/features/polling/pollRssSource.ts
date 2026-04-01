import { getAllSources } from "../sources/getAllSources";
import { fetchRssFeed } from "./fetchRssFeed";
import type { NormalizedItemInput, NormalizedRSSItem } from "./types";
import { updateSource } from "../sources/updateSource";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

type PollRssSourceParams = {
  source: SourceRow;
};

export async function pollRssSource(
  params: PollRssSourceParams,
): Promise<NormalizedItemInput[] | null> {
  const feedItems = await fetchRssFeed(params.source.url);

  let newFeedItems: NormalizedRSSItem[];

  if (params.source.lastCollectedFrom) {
    newFeedItems = feedItems.filter(
      (item) => item.publishedAt > params.source.lastCollectedFrom!,
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

  if (newFeedItems.length < 1) return null;

  const now = new Date(Date.now());
  if (!params.source.lastCollectedFrom || newFeedItems.length >= 1) {
    await updateSource({
      sourceId: params.source.id,
      lastPolledFrom: now,
      lastCollectedFrom: now,
    });

    return newFeedItems.map((item) => ({
      sourceId: params.source.id,
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
      sourceId: params.source.id,
      lastPolledFrom: now,
    });
    return null;
  }
}
