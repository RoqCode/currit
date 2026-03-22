import { Hono } from "hono";
import { seedDB } from "./lib/seed";
import { getAllSources } from "./lib/getAllSources";

const app = new Hono();

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

export default app;
