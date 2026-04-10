import { Hono } from "hono";
import { createSourceRequestSchema } from "@currit/shared/validation/sourceInput";
import { z } from "zod";
import { clearSources } from "../features/sources/clearSources";
import { createSource } from "../features/sources/createSource";
import { deleteSourceById } from "../features/sources/deleteSourceById";
import { getAllSources } from "../features/sources/getAllSources";
import isUniqueViolationError from "../features/sources/isUniqueViolationError";
import setSourceActiveById from "../features/sources/setSourceActiveById";
import { InvalidSourceUrlError } from "../features/sources/validateSourceUrl";

const sourcesRoutes = new Hono();

const isDev = process.env.NODE_ENV === "development";

const sourceIdParamsSchema = z.object({
  id: z.uuid(),
});

const setSourceActiveBodySchema = z.object({
  active: z.boolean(),
});

sourcesRoutes.get("/api/sources", async (c) => {
  try {
    const sources = await getAllSources();
    return c.json({
      sources,
    });
  } catch (e) {
    console.error(e);
    return c.json({ res: "welp, something went wrong" });
  }
});

sourcesRoutes.post("/api/sources", async (c) => {
  const rawBody = await c.req.json();
  const parsedBody = createSourceRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return c.json({ error: "invalid body" }, 400);
  }

  const body = parsedBody.data;

  if (body.type === "hn") {
    return c.json({ error: "hn sources are builtin" }, 400);
  }

  try {
    await createSource(body.name, body.url, body.type);
    return c.json({ ok: true }, 201);
  } catch (e) {
    if (e instanceof InvalidSourceUrlError) {
      return c.json({ error: e.message }, 400);
    }

    if (isUniqueViolationError(e)) {
      return c.json({ error: "source already exists" }, 409);
    }

    console.error(e);
    return c.json({ error: "failed to create source" }, 500);
  }
});

sourcesRoutes.delete("/api/sources/:id", async (c) => {
  const parsedParams = sourceIdParamsSchema.safeParse(c.req.param());

  if (!parsedParams.success) {
    return c.json({ message: "not a valid id" }, 400);
  }

  const itemId = parsedParams.data.id;

  try {
    const deletedSourceId = await deleteSourceById(itemId);

    if (!deletedSourceId) return c.json({ error: "source not found" }, 404);

    return c.json({ ok: true }, 200);
  } catch (e) {
    console.error(`error while deleting source with id ${itemId}:`, e);
    return c.json({ message: "could not delete item" }, 500);
  }
});

sourcesRoutes.get("/reset-db", async (c) => {
  if (!isDev) {
    return c.json({ message: "no" }, 400);
  }

  try {
    await clearSources();
    return c.json({ ok: true, message: "sources table reset" }, 200);
  } catch (e) {
    console.error("failed to clear sources table", e);
    return c.json({ error: "failed to clear sources table" }, 500);
  }
});

sourcesRoutes.patch("/api/sources/:id/active", async (c) => {
  const parsedParams = sourceIdParamsSchema.safeParse(c.req.param());

  if (!parsedParams.success) {
    return c.json({ message: "not a valid id" }, 400);
  }

  const itemId = parsedParams.data.id;

  const rawBody = await c.req.json();
  const parsedBody = setSourceActiveBodySchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return c.json({ error: "invalid body" }, 400);
  }

  const updatedSource = await setSourceActiveById(itemId, parsedBody.data.active);
  if (!updatedSource) return c.json({ error: "source not found" }, 404);

  return c.json({ ok: true, source: updatedSource }, 200);
});

export default sourcesRoutes;
