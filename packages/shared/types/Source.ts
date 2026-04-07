import type { SourceType } from "./CreateSourceInput";

export type Source = {
  name: string;
  url: string;
  id: string;
  createdAt: string;
  type: SourceType;
  active: boolean;
};
