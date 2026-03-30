import { useState } from "react";
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
      const data = await res.json();
      setFeedItems(data.sources);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={handlePoll}>
        {loading ? "Loading Feed" : "Poll Sources"}
      </button>

      {feedItems.length ? (
        <ul>
          {feedItems.map((item) => (
            <li>{item.title}</li>
          ))}
        </ul>
      ) : (
        <p>Feed is empty :(</p>
      )}

      {error && <p>Error</p>}
    </>
  );
}
