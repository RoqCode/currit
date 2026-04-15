import { Hono } from "hono";
import z from "zod";
import setItemLikeById from "../features/item/setItemLikeById";

const itemRoutes = new Hono();

const itemIdParamsSchema = z.object({
  id: z.uuid(),
});

const setItemLikeBodySchema = z.object({
  like: z.boolean(),
});

itemRoutes.patch("/api/items/:id/like", async (c) => {
  const parsedParams = itemIdParamsSchema.safeParse(c.req.param());

  if (!parsedParams.success) {
    return c.json({ message: "not a valid id" }, 400);
  }

  const itemId = parsedParams.data.id;

  const rawBody = await c.req.json();
  const parsedBody = setItemLikeBodySchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return c.json({ error: "invalid body" }, 400);
  }

  const updatedFeedback = await setItemLikeById(itemId, parsedBody.data.like);

  if (!updatedFeedback) {
    return c.json({ error: "item feedback update failed" }, 404);
  }

  return c.json({ ok: true, feedback: updatedFeedback }, 200);
});

export default itemRoutes;
