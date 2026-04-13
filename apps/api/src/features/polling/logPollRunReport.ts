import type { PollRunReport } from "./types";

export default function logPollRunReport(report: PollRunReport): void {
  console.log("\nPoll run");
  console.log(`started     ${formatLocalDateTime(report.startedAt)}`);
  console.log(`duration    ${formatDuration(report.durationMs)}`);

  console.log("");
  console.log("sources");
  console.log(
    `  total      ${report.sources.total}  rss ${report.sources.byType.rss}  subreddit ${report.sources.byType.subreddit}  hn ${report.sources.byType.hn}`,
  );

  console.log("");
  console.log("polling");
  console.log(
    `  overall    success ${report.polling.successCount}  error ${report.polling.errorCount}  skipped ${report.polling.skippedCount}  fetched ${report.polling.fetchedCount}  candidates ${report.polling.candidateItemCount}  failed ${report.polling.failedItemCount}`,
  );

  for (const [sourceType, stats] of Object.entries(report.polling.byType)) {
    console.log(
      `  ${sourceType.padEnd(10)}sources ${stats.sourceCount}  success ${stats.successCount}  error ${stats.errorCount}  skipped ${stats.skippedCount}  fetched ${stats.fetchedCount}  candidates ${stats.candidateItemCount}  failed ${stats.failedItemCount}  batch ${formatDuration(stats.batchDurationMs)}`,
    );
  }

  console.log("");
  console.log("persistence");
  console.log(
    `  overall    input ${report.persistence.inputCount}  inserted ${report.persistence.insertedCount}  updated ${report.persistence.updatedCount}  skipped ${report.persistence.skippedCount}`,
  );
  console.log(
    `  rss        inserted ${report.persistence.insertedByType.rss}  updated ${report.persistence.updatedByType.rss}  skipped ${report.persistence.skippedByType.rss}  input ${report.persistence.inputByType.rss}`,
  );
  console.log(
    `  subreddit  inserted ${report.persistence.insertedByType.subreddit}  updated ${report.persistence.updatedByType.subreddit}  skipped ${report.persistence.skippedByType.subreddit}  input ${report.persistence.inputByType.subreddit}`,
  );
  console.log(
    `  hn         inserted ${report.persistence.insertedByType.hn}  updated ${report.persistence.updatedByType.hn}  skipped ${report.persistence.skippedByType.hn}  input ${report.persistence.inputByType.hn}`,
  );

  if (report.slowSources.length > 0) {
    console.log("");
    console.log("slow sources");
    for (const source of report.slowSources) {
      console.log(
        `  ${source.sourceType.padEnd(10)}${source.sourceName}  ${formatDuration(source.durationMs)}`,
      );
    }
  }

  if (report.errors.length > 0) {
    console.log("");
    console.log("errors");
    for (const error of report.errors) {
      console.log(
        `  ${error.sourceType.padEnd(10)}${error.sourceName}  ${error.errorType}  ${error.errorMessage}`,
      );
    }
  }

  if (report.skipped.length > 0) {
    console.log("");
    console.log("skipped");
    for (const skipped of report.skipped) {
      console.log(
        `  ${skipped.sourceType.padEnd(10)}${skipped.sourceName}  ${skipped.skipReason}  ${skipped.skipMessage}`,
      );
    }
  }
}

function formatLocalDateTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatDuration(durationMs: number): string {
  return `${durationMs.toFixed(2)}ms`;
}
