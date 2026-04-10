import { getAllSources } from "../sources/getAllSources";
import { updateSource } from "../sources/updateSource";
import fetchSubredditTopPosts from "./fetchSubredditTopPosts";
import { PollSourceResult } from "./types";
import { PollingError } from "../../shared/errors";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

export default async function pollSubredditSources(
  source: SourceRow,
): Promise<PollSourceResult> {
  const start = performance.now();

  let items;
  try {
    items = await fetchSubredditTopPosts(source.url);
  } catch (err) {
    if (err instanceof PollingError) {
      return {
        status: "error",
        errorType: err.code,
        errorMessage: err.message,
        sourceId: source.id,
        sourceName: source.name,
        sourceType: "subreddit",
        durationMs: performance.now() - start,
      };
    }

    throw err;
  }

  const now = new Date(Date.now());

  if (items.length < 1) {
    await updateSource({
      sourceId: source.id,
      lastPolledFrom: now,
    });

    return {
      status: "success",
      sourceId: source.id,
      sourceName: source.name,
      sourceType: "subreddit",
      durationMs: performance.now() - start,
      fetchedCount: 0,
      candidateItemCount: 0,
      failedItemCount: 0,
      items: [],
    };
  }

  if (!source.lastCollectedFrom) {
    await updateSource({
      sourceId: source.id,
      lastPolledFrom: now,
      lastCollectedFrom: now,
    });

    return {
      status: "success",
      sourceId: source.id,
      sourceName: source.name,
      sourceType: "subreddit",
      durationMs: performance.now() - start,
      fetchedCount: items.length,
      candidateItemCount: items.length,
      failedItemCount: 0,
      items: items.map((item) => ({
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
      })),
    };
  }

  await updateSource({
    sourceId: source.id,
    lastPolledFrom: now,
    lastCollectedFrom: now,
  });

  return {
    status: "success",
    sourceId: source.id,
    sourceName: source.name,
    sourceType: "subreddit",
    durationMs: performance.now() - start,
    fetchedCount: items.length,
    candidateItemCount: items.length,
    failedItemCount: 0,
    items: items.map((item) => ({
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
    })),
  };
}
