import type { SourceType } from "./CreateSourceInput.js";

export type Source = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  type: SourceType;
  active: boolean;
  isBuiltin: boolean;
};
