import app from "./app.js";
import { serve } from "@hono/node-server";

console.log("boot", new Date().toISOString());

serve(app);
