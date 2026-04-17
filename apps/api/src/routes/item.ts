import { Hono } from "hono";
import z from "zod";
import setItemLikeById from "../features/item/setItemLikeById";
import setItemBookmarkById from "../features/item/setItemBookmarkById";
import setItemReadById from "../features/item/setItemReadById";
import getBookmarked from "../features/item/getBookmarked";

function toFeedItemFeedback(feedback: {
  likedAt: Date | null;
  bookmarkedAt: Date | null;
  readAt: Date | null;
}) {
  return {
    likedAt: feedback.likedAt?.toISOString() ?? null,
    bookmarkedAt: feedback.bookmarkedAt?.toISOString() ?? null,
    readAt: feedback.readAt?.toISOString() ?? null,
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

const itemRoutes = new Hono();

const itemIdParamsSchema = z.object({
  id: z.uuid(),
});

const setItemLikeBodySchema = z.object({
  like: z.boolean(),
});

const setItemBookmarkBodySchema = z.object({
  bookmark: z.boolean(),
});

const setItemReadBodySchema = z.object({
  read: z.boolean(),
});

async function parseJsonBody<T>(
  c: { req: { json: () => Promise<unknown> } },
  schema: z.ZodSchema<T>,
) {
  try {
    const rawBody = await c.req.json();
    const parsedBody = schema.safeParse(rawBody);

    if (!parsedBody.success) {
      return { ok: false as const, error: "invalid body" as const };
    }

    return { ok: true as const, data: parsedBody.data };
  } catch {
    return { ok: false as const, error: "invalid json" as const };
  }
}

itemRoutes.patch("/api/items/:id/like", async (c) => {
  const parsedParams = itemIdParamsSchema.safeParse(c.req.param());

  if (!parsedParams.success) {
    return c.json({ message: "not a valid id" }, 400);
  }

  const itemId = parsedParams.data.id;

  const parsedBody = await parseJsonBody(c, setItemLikeBodySchema);

  if (!parsedBody.ok) {
    return c.json({ error: parsedBody.error }, 400);
  }

  try {
    const updatedFeedback = await setItemLikeById(itemId, parsedBody.data.like);

    if (!updatedFeedback) {
      return c.json({ error: "item not found" }, 404);
    }

    return c.json(
      { ok: true, feedback: toFeedItemFeedback(updatedFeedback) },
      200,
    );
  } catch (e) {
    console.error(`failed to update like for item ${itemId}`, e);
    return c.json({ error: "failed to update item feedback" }, 500);
  }
});

itemRoutes.patch("/api/items/:id/bookmark", async (c) => {
  const parsedParams = itemIdParamsSchema.safeParse(c.req.param());

  if (!parsedParams.success) {
    return c.json({ message: "not a valid id" }, 400);
  }

  const itemId = parsedParams.data.id;

  const parsedBody = await parseJsonBody(c, setItemBookmarkBodySchema);

  if (!parsedBody.ok) {
    return c.json({ error: parsedBody.error }, 400);
  }

  try {
    const updatedFeedback = await setItemBookmarkById(
      itemId,
      parsedBody.data.bookmark,
    );

    if (!updatedFeedback) {
      return c.json({ error: "item not found" }, 404);
    }

    return c.json(
      { ok: true, feedback: toFeedItemFeedback(updatedFeedback) },
      200,
    );
  } catch (e) {
    console.error(`failed to update bookmark for item ${itemId}`, e);
    return c.json({ error: "failed to update item feedback" }, 500);
  }
});

itemRoutes.patch("/api/items/:id/read", async (c) => {
  const parsedParams = itemIdParamsSchema.safeParse(c.req.param());

  if (!parsedParams.success) {
    return c.json({ message: "not a valid id" }, 400);
  }

  const itemId = parsedParams.data.id;

  const parsedBody = await parseJsonBody(c, setItemReadBodySchema);

  if (!parsedBody.ok) {
    return c.json({ error: parsedBody.error }, 400);
  }

  try {
    const updatedFeedback = await setItemReadById(itemId, parsedBody.data.read);

    if (!updatedFeedback) {
      return c.json({ error: "item not found" }, 404);
    }

    return c.json(
      { ok: true, feedback: toFeedItemFeedback(updatedFeedback) },
      200,
    );
  } catch (e) {
    console.error(`failed to update read state for item ${itemId}`, e);
    return c.json({ error: "failed to update item feedback" }, 500);
  }
});

itemRoutes.get("/api/items/bookmarked", async (c) => {
  try {
    const bookmarkedRows = await getBookmarked();

    const bookmarked = bookmarkedRows.map((row) => ({
      ...row.item,
      publishedAt: toIsoString(row.item.publishedAt),
      fetchedAt: toIsoString(row.item.fetchedAt),
      createdAt: toIsoString(row.item.createdAt),
      lastObserved: row.item.lastObserved ? toIsoString(row.item.lastObserved) : null,
      feedback: toFeedItemFeedback(row.feedback),
    }));

    return c.json({ ok: true, bookmarked }, 200);
  } catch (e) {
    console.error("failed to fetch bookmarked items", e);
    return c.json({ message: "failed to fetch bookmarked items" }, 500);
  }
});

export default itemRoutes;
