import "dotenv/config";
import app from "./app.js";
import { serve } from "@hono/node-server";
import ensureBuiltinSources from "./features/sources/ensureBuiltinSources.js";

async function main() {
  await ensureBuiltinSources();

  const server = serve(app);

  process.on("SIGTERM", () => {
    server.close(() => process.exit());
  });

  console.log("server running");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
