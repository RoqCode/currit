import { useEffect, useState } from "react";
import type { Item } from "@currit/shared/types/Item";

export default function Feed() {
  const [feedItems, setFeedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handlePoll() {
    setLoading(true);
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

  async function fetchFeed() {
    // get feed from db

    setLoading(true);
    try {
      const res = await fetch("/api/feed");
      if (!res.ok) {
        throw new Error("failed to fetch feed");
      }
      const data = await res.json();

      console.log(data);
      setFeedItems(data.feed.items);
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

  return (
    <>
      <button onClick={handlePoll}>
        {loading ? "Loading Feed" : "Poll Sources"}
      </button>

      {feedItems.length ? (
        <ul>
          {feedItems.map((item) => (
            <li key={item.id}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <a target="_blank" href={item.url}>
                {item.url}
              </a>
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
