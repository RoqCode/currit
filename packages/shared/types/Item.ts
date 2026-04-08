import type { SourceType } from "./CreateSourceInput";

export type Item = {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
  type: SourceType;
};
