import { Hono } from "hono";
import { seedDB } from "./lib/seed";
import { getAllSources } from "./lib/getAllSources";
import type { CreateSourceInput } from "@currit/shared/types/CreateSourceInput";
import { createSource } from "./lib/createSource";
import { clearSources } from "./lib/clearSources";
import isUuid from "@currit/shared/utils/isUuid";
import { deleteSourceById } from "./lib/deleteSourceById";

const app = new Hono();

const isDev = process.env.NODE_ENV === "development";

app.get("/health", (c) => {
  return c.json({ ok: true });
});

app.get("/seed", async (c) => {
  try {
    await seedDB();
    return c.json({ res: "db seeded" });
  } catch (e) {
    console.error(e);
    return c.json({ res: "welp, something went wrong" });
  }
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

  if (typeof rawBody.name !== "string" || typeof rawBody.url !== "string") {
    return c.json({ error: "invalid body" }, 400);
  }

  const body = rawBody as CreateSourceInput;

  try {
    await createSource(body.name, body.url);
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

export default app;
