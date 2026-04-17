import { z } from "zod";
import { itemFeedbackSchema } from "./ItemFeedback.js";
import { sourceTypeSchema } from "../validation/sourceInput.js";

export const bookmarkedItemSchema = z.object({
  id: z.uuid(),
  sourceId: z.uuid().nullable(),
  type: sourceTypeSchema,
  externalId: z.string().nullable(),
  title: z.string(),
  author: z.string().nullable(),
  description: z.string().nullable(),
  url: z.url(),
  publishedAt: z.string(),
  fetchedAt: z.string(),
  createdAt: z.string(),
  itemScore: z.number().nullable(),
  commentCount: z.number().nullable(),
  lastObserved: z.string().nullable(),
  feedback: itemFeedbackSchema,
});

export const getBookmarkedResponseSchema = z.object({
  ok: z.literal(true),
  bookmarked: z.array(bookmarkedItemSchema),
});

export type BookmarkedItem = z.infer<typeof bookmarkedItemSchema>;
export type GetBookmarkedResponse = z.infer<
  typeof getBookmarkedResponseSchema
>;
