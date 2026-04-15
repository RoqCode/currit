import { z } from "zod";
import { sourceTypeSchema } from "../validation/sourceInput.js";

export const feedItemFeedbackSchema = z.object({
  likedAt: z.string().nullable(),
  bookmarkedAt: z.string().nullable(),
  readAt: z.string().nullable(),
});

export const feedItemSchema = z.object({
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
  position: z.number(),
  bucket: sourceTypeSchema,
  scoreAtSelection: z.number().nullable(),
  feedback: feedItemFeedbackSchema,
});

export const feedSchema = z.object({
  id: z.uuid(),
  feedDate: z.string(),
  items: z.array(feedItemSchema),
});

export const getFeedResponseSchema = z.object({
  ok: z.literal(true),
  feed: feedSchema.nullable(),
});

export type FeedItem = z.infer<typeof feedItemSchema>;
export type Feed = z.infer<typeof feedSchema>;
export type GetFeedResponse = z.infer<typeof getFeedResponseSchema>;
