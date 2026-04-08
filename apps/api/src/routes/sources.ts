import type { CreateSourceInput } from "@currit/shared/types/CreateSourceInput";
import isUuid from "@currit/shared/utils/isUuid";
import { Hono } from "hono";
import { clearSources } from "../features/sources/clearSources";
import { createSource } from "../features/sources/createSource";
import { deleteSourceById } from "../features/sources/deleteSourceById";
import { getAllSources } from "../features/sources/getAllSources";
import isUniqueViolationError from "../features/sources/isUniqueViolationError";
import setSourceActiveById from "../features/sources/setSourceActiveById";

const sourcesRoutes = new Hono();

const isDev = process.env.NODE_ENV === "development";

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

  if (
    typeof rawBody.name !== "string" ||
    typeof rawBody.url !== "string" ||
    typeof rawBody.type !== "string"
  ) {
    return c.json({ error: "invalid body" }, 400);
  }

  const body = rawBody as CreateSourceInput;

  try {
    await createSource(body.name, body.url, body.type);
    return c.json({ ok: true }, 201);
  } catch (e) {
    if (isUniqueViolationError(e)) {
      return c.json({ error: "source already exists" }, 409);
    }

    console.error(e);
    return c.json({ error: "failed to create source" }, 500);
  }
});

sourcesRoutes.delete("/api/sources/:id", async (c) => {
  const itemId = c.req.param("id");

  if (!itemId || !isUuid(itemId)) {
    return c.json({ message: "not a valid id" }, 400);
  }

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
  const itemId = c.req.param("id");

  if (!itemId || !isUuid(itemId)) {
    return c.json({ message: "not a valid id" }, 400);
  }

  const rawBody = await c.req.json();

  if (typeof rawBody.active !== "boolean") {
    return c.json({ error: "invalid body" }, 400);
  }

  const updatedSource = await setSourceActiveById(itemId, rawBody.active);
  if (!updatedSource) return c.json({ error: "source not found" }, 404);

  return c.json({ ok: true, source: updatedSource }, 200);
});

export default sourcesRoutes;
