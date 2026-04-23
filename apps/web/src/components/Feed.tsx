import { useEffect, useState } from "react";
import {
  getFeedResponseSchema,
  type FeedItem,
} from "@currit/shared/types/Feed";
import FeedCard from "./FeedItem/FeedCard";

const showDebugActions =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("debug") === "1";

const debugButtonClass =
  "border border-border px-4 py-2 font-ui text-xs font-bold uppercase tracking-[0.16em] text-text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

export default function Feed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handlePoll() {
    setError(false);
    setLoading(true);
    console.log("polling");
    try {
      const res = await fetch("/api/poll", { method: "GET" });
      if (!res.ok) {
        throw new Error("failed to fetch sources");
      }
      await res.json();
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRebuildFeed() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/feed/rebuild", { method: "POST" });
      if (!res.ok) {
        throw new Error("failed to rebuild feed");
      }

      await res.json();
      await fetchFeed();
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRepoll() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/poll/repoll", { method: "POST" });
      if (!res.ok) {
        throw new Error("failed to repoll sources");
      }

      await res.json();
      setFeedItems([]);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFeed() {
    // get feed from db

    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/feed");
      if (!res.ok) {
        throw new Error("failed to fetch feed");
      }
      const rawData = await res.json();
      const parsedData = getFeedResponseSchema.safeParse(rawData);

      if (!parsedData.success) {
        throw new Error("invalid feed response");
      }

      const nextItems = parsedData.data.feed?.items ?? [];

      setFeedItems(nextItems);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleItemFeedbackUpdated(
    itemId: string,
    nextFeedback: FeedItem["feedback"],
  ) {
    setFeedItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          feedback: nextFeedback,
        };
      }),
    );
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <>
      {showDebugActions ? (
        <div className="mb-6 border border-border bg-surface p-4">
          <p className="mb-3 font-ui text-[0.65rem] font-bold uppercase tracking-[0.24em] text-text-muted">
            Debug actions
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={debugButtonClass}
              disabled={loading}
              onClick={handlePoll}
              type="button"
            >
              {loading ? "Working..." : "Poll Sources"}
            </button>
            <button
              className={debugButtonClass}
              disabled={loading}
              onClick={handleRebuildFeed}
              type="button"
            >
              Rebuild Feed
            </button>
            <button
              className={debugButtonClass}
              disabled={loading}
              onClick={handleRepoll}
              type="button"
            >
              Repoll Sources
            </button>
          </div>
        </div>
      ) : null}

      {feedItems.length ? (
        <ul className="flex flex-col gap-4">
          {feedItems.map((item) => (
            <li key={item.id}>
              <FeedCard
                item={item}
                onUpdateFeedback={handleItemFeedbackUpdated}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>Feed is empty :(</p>
      )}

      {error && <p>Error</p>}
    </>
  );
}
