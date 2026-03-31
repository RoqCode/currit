import type { CreateSourceInput } from "@currit/shared/types/CreateSourceInput";
import isUuid from "@currit/shared/utils/isUuid";
import { Hono } from "hono";
import { clearSources } from "./lib/clearSources";
import { createSource } from "./lib/createSource";
import { deleteSourceById } from "./lib/deleteSourceById";
import { getAllSources } from "./lib/getAllSources";
import { pollSources } from "./lib/pollSources";
import getFeed from "./lib/getFeed";

const app = new Hono();

const isDev = process.env.NODE_ENV === "development";

app.get("/health", (c) => {
  return c.json({ ok: true });
});

app.get("/api/sources", async (c) => {
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

app.post("/api/sources", async (c) => {
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
    console.error(e);
    return c.json({ error: "failed to create source" }, 500);
  }
});

app.delete("/api/sources/:id", async (c) => {
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

app.get("/reset-db", async (c) => {
  console.log(process.env.NODE_ENV);

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

app.get("/api/poll", async (c) => {
  try {
    await pollSources();

    return c.json({ ok: true }, 201);
  } catch (e) {
    console.error("failed to poll sources", e);
    return c.json({ message: "failed to poll sources" }, 501);
  }
});

app.get("/api/feed", async (c) => {
  try {
    const feed = await getFeed();

    return c.json({ ok: true, feed }, 200);
  } catch (e) {
    console.error("failed to fetch feed", e);
    return c.json({ message: "failed to fetch feed" }, 501);
  }
});

export default app;
