import { getAllSources } from "../sources/getAllSources";
import { updateSource } from "../sources/updateSource";
import fetchSubredditTopPosts from "./fetchSubredditTopPosts";
import { PollSourceResult } from "./types";
import { PollingError } from "../../shared/errors";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

export type PollSubredditSourceResult = PollSourceResult & {
  stopPollingAfter?: boolean;
  stopPollingMessage?: string;
};

export default async function pollSubredditSources(
  source: SourceRow,
): Promise<PollSubredditSourceResult> {
  const start = performance.now();

  let fetchResult;
  try {
    fetchResult = await fetchSubredditTopPosts(source.url);
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
        stopPollingAfter: err.code === "rate_limit_error",
        stopPollingMessage:
          err.code === "rate_limit_error" ? err.message : undefined,
      };
    }

    throw err;
  }

  const { items, rateLimit } = fetchResult;

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
      stopPollingAfter: rateLimit.shouldStopPolling,
      stopPollingMessage: buildStopPollingMessage(rateLimit),
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
      stopPollingAfter: rateLimit.shouldStopPolling,
      stopPollingMessage: buildStopPollingMessage(rateLimit),
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
    stopPollingAfter: rateLimit.shouldStopPolling,
    stopPollingMessage: buildStopPollingMessage(rateLimit),
  };
}

function buildStopPollingMessage(rateLimit: {
  remaining: number | null;
  resetSeconds: number | null;
  shouldStopPolling: boolean;
}) {
  if (!rateLimit.shouldStopPolling) {
    return undefined;
  }

  const remaining =
    rateLimit.remaining === null ? "unknown" : rateLimit.remaining.toString();
  const resetSeconds =
    rateLimit.resetSeconds === null
      ? "unknown"
      : rateLimit.resetSeconds.toString();

  return `Stopped starting new Reddit requests because remaining budget dropped below worker limit (remaining ${remaining}, reset ${resetSeconds}s)`;
}
