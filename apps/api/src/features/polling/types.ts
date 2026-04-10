import { SourceType } from "@currit/shared/types/CreateSourceInput";

export type PollSourceErrorType =
  | "network_error"
  | "http_error"
  | "parse_error"
  | "db_error"
  | "unknown_error";

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

export type PollSourceResult = PollSourceSuccessResult | PollSourceErrorResult;

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
    fetchedCount: number;
    candidateItemCount: number;
    failedItemCount: number;
    byType: Record<keyof ItemCountsByType, {
      sourceCount: number;
      successCount: number;
      errorCount: number;
      fetchedCount: number;
      candidateItemCount: number;
      failedItemCount: number;
      batchDurationMs: number;
    }>;
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
  skippedCount: number;
  inputByType: ItemCountsByType;
  insertedByType: ItemCountsByType;
  skippedByType: ItemCountsByType;
};
