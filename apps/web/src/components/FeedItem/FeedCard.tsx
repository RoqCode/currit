import type { Item } from "@currit/shared/types/Item";
import { useState } from "react";
import ToggleAction from "./ToggleAction";

type Props = {
  item: Item;
  onPatchItem: () => void;
};

export default function FeedCard(props: Props) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [read, setRead] = useState(false);

  async function handleToggleLike() {
    console.log("liked", props.item.id);
    setLiked(!liked);
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
        <ToggleAction label="like" state={liked} onToggle={handleToggleLike} />
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
