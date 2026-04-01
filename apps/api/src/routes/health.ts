import { Hono } from "hono";

const healthRoutes = new Hono();

healthRoutes.get("/health", (c) => {
  return c.json({ ok: true });
});

export default healthRoutes;
