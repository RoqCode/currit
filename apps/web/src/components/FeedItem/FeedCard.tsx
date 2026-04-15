import type { FeedItem } from "@currit/shared/types/Feed";
import { useState } from "react";
import ToggleAction from "./ToggleAction";

type Props = {
  item: FeedItem;
  onPatchItem: () => void | Promise<void>;
};

export default function FeedCard(props: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [read, setRead] = useState(false);

  async function handleToggleLike() {
    console.log("liked", props.item.id);
    try {
      const res = await fetch(`/api/items/${props.item.id}/like`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          like: !props.item.feedback.likedAt,
        }),
      });

      if (!res.ok) {
        throw new Error("like update failed");
      }

      await props.onPatchItem();
    } catch (e) {
      console.error(e);
    }
  }
  async function handleToggleBookmark() {
    console.log("bookmarked", props.item.id);
    setBookmarked(!bookmarked);
  }
  async function handleToggleRead() {
    console.log("read", props.item.id);
    setRead(!read);
  }

  return (
    <div>
      <h2>{props.item.title}</h2>
      <p>{props.item.description}</p>
      <a target="_blank" href={props.item.url}>
        {props.item.url}
      </a>

      <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
        <ToggleAction
          label="like"
          state={Boolean(props.item.feedback.likedAt)}
          onToggle={handleToggleLike}
        />
        <ToggleAction
          label="bookmark"
          state={bookmarked}
          onToggle={handleToggleBookmark}
        />
        <ToggleAction label="read" state={read} onToggle={handleToggleRead} />
      </div>
    </div>
  );
}
