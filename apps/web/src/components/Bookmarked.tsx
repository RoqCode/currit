import {
  getBookmarkedResponseSchema,
  type BookmarkedItem,
} from "@currit/shared/types/Bookmarked";
import type { FeedItem } from "@currit/shared/types/Feed";
import { useEffect, useState } from "react";
import FeedCard from "./FeedItem/FeedCard";

export default function Bookmarked() {
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchBookmarked();
  }, []);

  async function fetchBookmarked() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/items/bookmarked");
      if (!res.ok) {
        throw new Error("failed to fetch bookmarked items");
      }
      const rawData = await res.json();
      const parsedData = getBookmarkedResponseSchema.safeParse(rawData);

      if (!parsedData.success) {
        throw new Error("invalid bookmarked response");
      }

      const nextItems = parsedData.data.bookmarked ?? [];

      setBookmarkedItems(nextItems);
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
    setBookmarkedItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (!nextFeedback.bookmarkedAt) {
          return [];
        }

        return {
          ...item,
          feedback: nextFeedback,
        };
      }),
    );
  }

  return (
    <>
      {loading ? (
        <p>Loading...</p>
      ) : bookmarkedItems.length ? (
        <ul>
          {bookmarkedItems.map((item) => (
            <li key={item.id}>
              <FeedCard item={item} onUpdateFeedback={handleItemFeedbackUpdated} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No bookmarks yet.</p>
      )}

      {error && <p>Error</p>}
    </>
  );
}
