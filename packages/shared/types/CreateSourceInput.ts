export type SourceType = "rss" | "subreddit" | "hn";

export type CreateSourceInput = {
  name: string;
  url: string;
  type: SourceType;
  isBuiltin?: boolean;
};
