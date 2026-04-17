import { Hono } from "hono";
import feedRoutes from "./routes/feed";
import healthRoutes from "./routes/health";
import pollingRoutes from "./routes/polling";
import sourcesRoutes from "./routes/sources";
import itemRoutes from "./routes/item";

const app = new Hono();

app.route("/", healthRoutes);
app.route("/", sourcesRoutes);
app.route("/", pollingRoutes);
app.route("/", feedRoutes);
app.route("/", itemRoutes);

export default app;
