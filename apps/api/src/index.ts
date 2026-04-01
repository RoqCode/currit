import "dotenv/config";
import app from "./app.js";
import { serve } from "@hono/node-server";

const server = serve(app);

process.on("SIGTERM", () => {
  server.close(() => process.exit());
});
