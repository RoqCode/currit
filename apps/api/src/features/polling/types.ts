import { SourceType } from "@currit/shared/types/CreateSourceInput";

export type PollSourceStatus = "success" | "error";
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
  insertedCount: number;
  skippedCount: number;
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
  durationMS: number;
  errorCount: number;
  results: PollSourceResult[];
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
  insertedCount: number;
  skippedCount: number;
};
