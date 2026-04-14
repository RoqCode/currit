import { useEffect, useState } from "react";
import type { Item } from "@currit/shared/types/Item";
import FeedCard from "./FeedItem/FeedCard";

export default function Feed() {
  const [feedItems, setFeedItems] = useState<Item[]>([]);
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
      const data = await res.json();

      setFeedItems(data.feed?.items ?? []);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  function handlePatchItem() {
    console.log("item patched");
  }

  return (
    <>
      <button onClick={handlePoll}>
        {loading ? "Working..." : "Poll Sources"}
      </button>
      <button onClick={handleRebuildFeed}>Rebuild Feed</button>
      <button onClick={handleRepoll}>Repoll Sources</button>

      {feedItems.length ? (
        <ul>
          {feedItems.map((item) => (
            <li key={item.id}>
              <FeedCard item={item} onPatchItem={handlePatchItem} />
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
