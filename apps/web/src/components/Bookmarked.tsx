import {
  getBookmarkedResponseSchema,
  type BookmarkedItem,
} from "@currit/shared/types/Bookmarked";
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

  return (
    <>
      {bookmarkedItems.length ? (
        <ul>
          {bookmarkedItems.map((item) => (
            <li key={item.id}>
              <FeedCard item={item} />
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
