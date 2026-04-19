import { z } from "zod";
import { itemFeedbackSchema } from "./ItemFeedback.js";
import { sourceTypeSchema } from "../validation/sourceInput.js";

export const feedItemSchema = z.object({
  id: z.uuid(),
  sourceId: z.uuid().nullable(),
  sourceName: z.string().nullable(),
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
  feedback: itemFeedbackSchema,
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

export const patchItemFeedbackResponseSchema = z.object({
  ok: z.literal(true),
  feedback: itemFeedbackSchema,
});

export type FeedItem = z.infer<typeof feedItemSchema>;
export type Feed = z.infer<typeof feedSchema>;
export type GetFeedResponse = z.infer<typeof getFeedResponseSchema>;
export type PatchItemFeedbackResponse = z.infer<
  typeof patchItemFeedbackResponseSchema
>;
