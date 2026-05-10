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

  const isInitialLoading = loading && !bookmarkedItems.length;

  return (
    <div className="space-y-4">
      {isInitialLoading ? (
        <p className="font-ui text-sm uppercase tracking-[0.16em] text-text-muted">
          Loading bookmarks...
        </p>
      ) : bookmarkedItems.length ? (
        <ul className="flex flex-col gap-4">
          {bookmarkedItems.map((item) => (
            <li key={item.id}>
              <FeedCard
                item={item}
                onUpdateFeedback={handleItemFeedbackUpdated}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-border bg-surface p-5">
          <p className="mb-1 font-ui text-[0.65rem] font-bold uppercase tracking-[0.24em] text-primary">
            No bookmarks
          </p>
          <p className="font-reading text-sm leading-relaxed text-text-muted">
            Saved items will show up here once you bookmark them from the feed.
          </p>
        </div>
      )}

      {error && (
        <p className="border border-border bg-surface p-4 font-ui text-sm text-primary">
          Could not load bookmarks.
        </p>
      )}
    </div>
  );
}
