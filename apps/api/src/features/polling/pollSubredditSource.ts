import { getAllSources } from "../sources/getAllSources";
import { updateSource } from "../sources/updateSource";
import fetchSubredditTopPosts from "./fetchSubredditTopPosts";
import { NormalizedItemInput } from "./types";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

export default async function pollSubredditSources(
  source: SourceRow,
): Promise<NormalizedItemInput[] | null> {
  const items = await fetchSubredditTopPosts(source.url);
  const now = new Date(Date.now());

  if (!items) return null;

  if (items.length < 1) {
    await updateSource({
      sourceId: source.id,
      lastPolledFrom: now,
    });

    return null;
  }

  if (!source.lastCollectedFrom || items.length >= 1) {
    await updateSource({
      sourceId: source.id,
      lastPolledFrom: now,
      lastCollectedFrom: now,
    });

    return items.map((item) => ({
      sourceId: source.id,
      sourceType: "subreddit",
      externalId: String(item.id),
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
      sourceId: source.id,
      lastPolledFrom: now,
    });

    return null;
  }
}
