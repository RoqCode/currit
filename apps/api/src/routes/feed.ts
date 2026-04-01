import { Hono } from "hono";
import buildFeed from "../features/feed/buildFeed";
import { deleteFeedForToday } from "../features/feed/deleteFeedForToday";
import getFeed from "../features/feed/getFeed";

const feedRoutes = new Hono();

const isDev = process.env.NODE_ENV === "development";

feedRoutes.get("/api/feed", async (c) => {
  try {
    const feed = await getFeed();

    return c.json({ ok: true, feed }, 200);
  } catch (e) {
    console.error("failed to fetch feed", e);
    return c.json({ message: "failed to fetch feed" }, 501);
  }
});

feedRoutes.post("/api/feed/rebuild", async (c) => {
  if (!isDev) {
    return c.json({ message: "not available outside development" }, 403);
  }

  try {
    const deletedFeedResult = await deleteFeedForToday();
    const buildResult = await buildFeed();

    return c.json(
      {
        ok: true,
        deletedFeedResult,
        feedId: buildResult.feed.id,
        selectedItemCount: buildResult.selectedItemCount,
      },
      201,
    );
  } catch (e) {
    console.error("failed to rebuild feed", e);
    return c.json({ message: "failed to rebuild feed" }, 500);
  }
});

export default feedRoutes;
