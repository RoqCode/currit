import pollHnSource from "./pollHnSource";
import { pollRssSource } from "./pollRssSource";
import type {
  ItemCountsByType,
  PollRunReport,
  PollSourceResult,
} from "./types";
import { savePolledItems } from "./savePolledItems";
import pollSubredditSource from "./pollSubredditSource";
import { getActiveSources } from "../sources/getActiveSources";
import mapWithConcurrency from "./mapWithConcurrency";
import fetchHnTopStories from "./fetchHnTopStories";
import { PollingError } from "../../shared/errors";
import logPollRunReport from "./logPollRunReport";
import type { PollSubredditSourceResult } from "./pollSubredditSource";

export async function pollSources(): Promise<void> {
  const startedAt = new Date();
  const sources = await getActiveSources();

  if (sources.length < 1) {
    throw new Error("No viable Sources found");
  }
  const start = performance.now();

  const rssSources = sources.filter((source) => source.type === "rss");
  const subredditSources = sources.filter(
    (source) => source.type === "subreddit",
  );
  const hnSource = sources.find((source) => source.type === "hn");

  const [hnBatch, rssBatch, redditBatch] = await Promise.all([
    pollHnSources(hnSource),
    pollRssSources(rssSources),
    pollSubredditSources(subredditSources),
  ]);

  const allResults = [
    ...(hnBatch.result ? [hnBatch.result] : []),
    ...rssBatch.results,
    ...redditBatch.results,
  ];

  const items = allResults
    .filter((result) => result.status === "success")
    .flatMap((result) => result.items);

  // TODO: normalize scores - only after hn and reddit - RSS Feeds cant be scored
  // normalizeItemScores(newItems)

  const insertResults = await savePolledItems({ items });
  const report = buildPollRunReport({
    startedAt,
    durationMs: performance.now() - start,
    sources,
    results: allResults,
    batchDurations: {
      rss: rssBatch.durationMs,
      subreddit: redditBatch.durationMs,
      hn: hnBatch.durationMs,
    },
    persistence: insertResults,
  });

  try {
    logPollRunReport(report);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function pollHnSources(
  hnSource: Awaited<ReturnType<typeof getActiveSources>>[number] | undefined,
): Promise<{ result: PollSourceResult | null; durationMs: number }> {
  if (!hnSource) {
    return {
      result: null,
      durationMs: 0,
    };
  }

  const start = performance.now();

  let hnTopPostIds: number[];
  try {
    hnTopPostIds = await fetchHnTopStories(hnSource);
  } catch (err) {
    if (err instanceof PollingError) {
      return {
        result: {
          status: "error",
          errorType: err.code,
          errorMessage: err.message,
          sourceId: hnSource.id,
          sourceName: hnSource.name,
          sourceType: "hn",
          durationMs: performance.now() - start,
        },
        durationMs: performance.now() - start,
      };
    }

    throw err;
  }

  const hnItemsWithPossibleFailures = await mapWithConcurrency(
    hnTopPostIds,
    (itemId) => pollHnSource(hnSource.id, itemId),
    20,
  );

  const items = hnItemsWithPossibleFailures.filter((item) => item !== null);

  return {
    result: {
      status: "success",
      sourceId: hnSource.id,
      sourceName: hnSource.name,
      sourceType: "hn",
      durationMs: performance.now() - start,
      fetchedCount: hnTopPostIds.length,
      candidateItemCount: items.length,
      failedItemCount: hnTopPostIds.length - items.length,
      items,
    },
    durationMs: performance.now() - start,
  };
}

async function pollRssSources(
  rssSources: Awaited<ReturnType<typeof getActiveSources>>,
): Promise<{ results: PollSourceResult[]; durationMs: number }> {
  const start = performance.now();
  const results = await mapWithConcurrency(rssSources, pollRssSource, 20);

  return {
    results,
    durationMs: performance.now() - start,
  };
}

async function pollSubredditSources(
  subredditSources: Awaited<ReturnType<typeof getActiveSources>>,
): Promise<{ results: PollSourceResult[]; durationMs: number }> {
  const start = performance.now();
  let shouldStopPolling = false;
  let stopPollingMessage: string | undefined;
  const results = await mapWithConcurrency(subredditSources, async (source) => {
    if (shouldStopPolling) {
      return createRateLimitSkippedResult(source, stopPollingMessage);
    }

    const result = await pollSubredditSource(source);

    if (result.stopPollingAfter) {
      shouldStopPolling = true;
      stopPollingMessage = result.stopPollingMessage;
    }

    return stripSubredditControlFields(result);
  }, 5);

  return {
    results,
    durationMs: performance.now() - start,
  };
}

function buildPollRunReport(params: {
  startedAt: Date;
  durationMs: number;
  sources: Awaited<ReturnType<typeof getActiveSources>>;
  results: PollSourceResult[];
  batchDurations: ItemCountsByType;
  persistence: Awaited<ReturnType<typeof savePolledItems>>;
}): PollRunReport {
  const sourceCounts: ItemCountsByType = {
    rss: params.sources.filter((source) => source.type === "rss").length,
    subreddit: params.sources.filter((source) => source.type === "subreddit")
      .length,
    hn: params.sources.filter((source) => source.type === "hn").length,
  };

  const byType: PollRunReport["polling"]["byType"] = {
    rss: createEmptyPollingTypeStats(sourceCounts.rss, params.batchDurations.rss),
    subreddit: createEmptyPollingTypeStats(
      sourceCounts.subreddit,
      params.batchDurations.subreddit,
    ),
    hn: createEmptyPollingTypeStats(sourceCounts.hn, params.batchDurations.hn),
  };

  const errors: PollRunReport["errors"] = [];
  const slowSources = [...params.results]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 5)
    .map((result) => ({
      sourceId: result.sourceId,
      sourceName: result.sourceName,
      sourceType: result.sourceType,
      durationMs: result.durationMs,
    }));

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let fetchedCount = 0;
  let candidateItemCount = 0;
  let failedItemCount = 0;
  const skipped: PollRunReport["skipped"] = [];

  for (const result of params.results) {
    const typeStats = byType[result.sourceType];

    if (result.status === "skipped") {
      skippedCount += 1;
      typeStats.skippedCount += 1;
      skipped.push({
        sourceId: result.sourceId,
        sourceName: result.sourceName,
        sourceType: result.sourceType,
        skipReason: result.skipReason,
        skipMessage: result.skipMessage,
      });
      continue;
    }

    if (result.status === "error") {
      errorCount += 1;
      typeStats.errorCount += 1;
      errors.push({
        sourceId: result.sourceId,
        sourceName: result.sourceName,
        sourceType: result.sourceType,
        errorType: result.errorType,
        errorMessage: result.errorMessage,
      });
      continue;
    }

    successCount += 1;
    fetchedCount += result.fetchedCount;
    candidateItemCount += result.candidateItemCount;
    failedItemCount += result.failedItemCount;

    typeStats.successCount += 1;
    typeStats.fetchedCount += result.fetchedCount;
    typeStats.candidateItemCount += result.candidateItemCount;
    typeStats.failedItemCount += result.failedItemCount;
  }

  return {
    startedAt: params.startedAt,
    durationMs: params.durationMs,
    sources: {
      total: params.sources.length,
      byType: sourceCounts,
    },
    polling: {
      successCount,
      errorCount,
      skippedCount,
      fetchedCount,
      candidateItemCount,
      failedItemCount,
      byType,
    },
    persistence: params.persistence,
    slowSources,
    errors,
    skipped,
  };
}

function createEmptyPollingTypeStats(
  sourceCount: number,
  batchDurationMs: number,
) {
  return {
    sourceCount,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    fetchedCount: 0,
    candidateItemCount: 0,
    failedItemCount: 0,
    batchDurationMs,
  };
}

function createRateLimitSkippedResult(
  source: Awaited<ReturnType<typeof getActiveSources>>[number],
  stopPollingMessage?: string,
): PollSourceResult {
  return {
    status: "skipped",
    skipReason: "rate_limit",
    skipMessage:
      stopPollingMessage ??
      "Skipped because Reddit rate-limit budget was exhausted earlier in this batch",
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    durationMs: 0,
  };
}

function stripSubredditControlFields(
  result: PollSubredditSourceResult,
): PollSourceResult {
  const { stopPollingAfter: _stopPollingAfter, ...pollSourceResult } = result;

  return pollSourceResult;
}
