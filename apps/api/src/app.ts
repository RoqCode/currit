import { Hono } from "hono";

const app = new Hono();

app.get("/hello", (c) => {
  return c.json({
    hello: "from outer space",
  });
});

app.get("/health", (c) => {
  return c.json({ ok: true });
});

export default app;
