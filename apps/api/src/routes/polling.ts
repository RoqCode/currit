import { Hono } from "hono";
import { deleteFeedForToday } from "../features/feed/deleteFeedForToday";
import { deleteItemsForToday } from "../features/feed/deleteItemsForToday";
import { pollSources } from "../features/polling/pollSources";
import { resetSourcePollingState } from "../features/sources/resetSourcePollingState";

const pollingRoutes = new Hono();

const isDev = process.env.NODE_ENV === "development";

pollingRoutes.get("/api/poll", async (c) => {
  try {
    await pollSources();

    return c.json({ ok: true }, 201);
  } catch (e) {
    console.error("failed to poll sources", e);
    return c.json({ message: "failed to poll sources" }, 501);
  }
});

pollingRoutes.post("/api/poll/repoll", async (c) => {
  if (!isDev) {
    return c.json({ message: "not available outside development" }, 403);
  }

  try {
    const deletedFeedResult = await deleteFeedForToday();
    const deletedItemsResult = await deleteItemsForToday();
    const resetSourcesResult = await resetSourcePollingState();

    await pollSources();

    return c.json(
      {
        ok: true,
        deletedFeedResult,
        deletedItemsResult,
        resetSourcesResult,
      },
      200,
    );
  } catch (e) {
    console.error("failed to repoll sources", e);
    return c.json({ message: "failed to repoll sources" }, 500);
  }
});

export default pollingRoutes;
