import { z } from "zod";

export const itemFeedbackSchema = z.object({
  likedAt: z.string().nullable(),
  bookmarkedAt: z.string().nullable(),
  readAt: z.string().nullable(),
});

export type ItemFeedback = z.infer<typeof itemFeedbackSchema>;
