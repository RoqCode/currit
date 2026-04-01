import { getAllSources } from "../sources/getAllSources";
import { updateSource } from "../sources/updateSource";
import fetchHnTopStories from "./fetchHnTopStories";
import type { NormalizedItemInput } from "./types";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

type PollHnSourceParams = {
  source: SourceRow;
};

export default async function pollHnSource(
  params: PollHnSourceParams,
): Promise<NormalizedItemInput[] | null> {
  const items = await fetchHnTopStories();

  if (items.length < 1) return null;

  const now = new Date(Date.now());
  if (!params.source.lastCollectedFrom || items.length >= 1) {
    await updateSource({
      sourceId: params.source.id,
      lastPolledFrom: now,
      lastCollectedFrom: now,
    });

    return items.map((item) => ({
      sourceId: params.source.id,
      sourceType: "hn",
      title: item.title,
      description: item.description,
      url: item.url,
      publishedAt: item.publishedAt,
      fetchedAt: now,
      itemScore: item.score,
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
