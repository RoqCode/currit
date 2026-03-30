export type PollSourceStatus = "success" | "error";
export type PollSourceErrorType =
  | "network_error"
  | "http_error"
  | "parse_error"
  | "db_error"
  | "unknown_error";

export type PollSourceSuccessResult = {
  sourceId: string;
  sourceName: string;
  status: "success";
  insertedCount: number;
  skippedCount: number;
};

export type PollSourceErrorResult = {
  sourceId: string;
  sourceName: string;
  status: "error";
  errorType: PollSourceErrorType;
  errorMessage: string;
};

export type PollSourceResult = PollSourceSuccessResult | PollSourceErrorResult;

export type PollSourcesResult = {
  totalSources: number;
  processedSources: number;
  successCount: number;
  errorCount: number;
  results: PollSourceResult[];
};

export type NormalizedItemInput = {
  title: string;
  description: string | null;
  url: string;
  publishedAt: Date;
};

export type SavePolledItemsResult = {
  insertedCount: number;
  skippedCount: number;
};
