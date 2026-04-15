import type { SourceType } from "./CreateSourceInput.js";

export type Item = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  type: SourceType;
};
