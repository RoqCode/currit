import type { SourceType } from "../../db/schema";

export type PollSourceErrorType =
  | "network_error"
  | "http_error"
  | "rate_limit_error"
  | "parse_error"
  | "db_error"
  | "unknown_error";

export type PollSourceSkipReason = "rate_limit";

export type PollSourceBaseResult = {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  durationMs: number;
};

export type PollSourceSuccessResult = PollSourceBaseResult & {
  status: "success";
  fetchedCount: number;
  candidateItemCount: number;
  failedItemCount: number;
  items: NormalizedItemInput[];
};

export type PollSourceErrorResult = PollSourceBaseResult & {
  status: "error";
  errorType: PollSourceErrorType;
  errorMessage: string;
};

export type PollSourceSkippedResult = PollSourceBaseResult & {
  status: "skipped";
  skipReason: PollSourceSkipReason;
  skipMessage: string;
};

export type PollSourceResult =
  | PollSourceSuccessResult
  | PollSourceErrorResult
  | PollSourceSkippedResult;

export type PollSourcesResult = {
  totalSources: number;
  processedSources: number;
  successCount: number;
  durationMs: number;
  errorCount: number;
  results: PollSourceResult[];
};

export type ItemCountsByType = {
  rss: number;
  subreddit: number;
  hn: number;
};

export type PollRunReport = {
  startedAt: Date;
  durationMs: number;
  sources: {
    total: number;
    byType: ItemCountsByType;
  };
  polling: {
    successCount: number;
    errorCount: number;
    skippedCount: number;
    fetchedCount: number;
    candidateItemCount: number;
    failedItemCount: number;
    byType: Record<
      keyof ItemCountsByType,
      {
        sourceCount: number;
        successCount: number;
        errorCount: number;
        skippedCount: number;
        fetchedCount: number;
        candidateItemCount: number;
        failedItemCount: number;
        batchDurationMs: number;
      }
    >;
  };
  persistence: SavePolledItemsResult;
  slowSources: Array<{
    sourceId: string;
    sourceName: string;
    sourceType: SourceType;
    durationMs: number;
  }>;
  errors: Array<{
    sourceId: string;
    sourceName: string;
    sourceType: SourceType;
    errorType: PollSourceErrorType;
    errorMessage: string;
  }>;
  skipped: Array<{
    sourceId: string;
    sourceName: string;
    sourceType: SourceType;
    skipReason: PollSourceSkipReason;
    skipMessage: string;
  }>;
};

export type NormalizedItemInput = {
  sourceId: string;
  sourceType: SourceType;
  externalId?: string | null;

  title: string;
  description: string | null;
  url: string;
  publishedAt: Date;
  fetchedAt?: Date;

  itemScore?: number | null;
  commentCount?: number | null;
  author?: string | null;
};

export type NormalizedRSSItem = {
  title: string;
  description: string | null;
  url: string;
  publishedAt: Date;
  author: string | null;
};

export type NormalizedHnItem = {
  id: number | string;
  title: string;
  description: string | null;
  url: string;
  publishedAt: Date;
  author: string | null;
  score: number | null;
  sourceType: "hn";
};

export type NormalizedSubredditItem = {
  id: number | string;
  title: string;
  description: string | null;
  url: string;
  publishedAt: Date;
  author: string | null;
  score: number | null;
  commentCount: number;
};

export type ScoredCandidate = {
  item: NormalizedItemInput;
  freshnessScore: number;
  sourceQualityScore: number;
  relevanceScore: number;
  finalScore: number;
};

export type SavePolledItemsResult = {
  inputCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  inputByType: ItemCountsByType;
  insertedByType: ItemCountsByType;
  updatedByType: ItemCountsByType;
  skippedByType: ItemCountsByType;
};
