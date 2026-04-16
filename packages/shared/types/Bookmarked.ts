import { z } from "zod";
import { sourceTypeSchema } from "../validation/sourceInput.js";

export const bookmarkedItemFeedbackSchema = z.object({
  likedAt: z.string().nullable(),
  bookmarkedAt: z.string().nullable(),
  readAt: z.string().nullable(),
});

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
  feedback: bookmarkedItemFeedbackSchema,
});

export const getBookmarkedResponseSchema = z.object({
  ok: z.literal(true),
  bookmarked: z.array(bookmarkedItemSchema),
});

export type BookmarkedItemFeedback = z.infer<
  typeof bookmarkedItemFeedbackSchema
>;
export type BookmarkedItem = z.infer<typeof bookmarkedItemSchema>;
export type GetBookmarkedResponse = z.infer<
  typeof getBookmarkedResponseSchema
>;
