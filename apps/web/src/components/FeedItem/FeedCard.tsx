import {
  patchItemFeedbackResponseSchema,
  type FeedItem,
} from "@currit/shared/types/Feed";
import ToggleAction from "./ToggleAction";

type FeedCardItem = Pick<
  FeedItem,
  "id" | "title" | "description" | "url" | "feedback"
>;

type Props = {
  item: FeedCardItem;
  onUpdateFeedback?: (itemId: string, feedback: FeedItem["feedback"]) => void;
};

export default function FeedCard(props: Props) {
  async function patchFeedback(
    path: "like" | "bookmark" | "read",
    body: { like?: boolean; bookmark?: boolean; read?: boolean },
    errorMessage: string,
  ) {
    try {
      const res = await fetch(`/api/items/${props.item.id}/${path}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(errorMessage);
      }

      const rawData = await res.json();
      const parsedData = patchItemFeedbackResponseSchema.safeParse(rawData);

      if (!parsedData.success) {
        throw new Error("invalid feedback response");
      }

      props.onUpdateFeedback?.(props.item.id, parsedData.data.feedback);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleLike() {
    await patchFeedback(
      "like",
      { like: !props.item.feedback.likedAt },
      "like update failed",
    );
  }

  async function handleToggleBookmark() {
    await patchFeedback(
      "bookmark",
      { bookmark: !props.item.feedback.bookmarkedAt },
      "bookmark update failed",
    );
  }

  async function handleToggleRead() {
    await patchFeedback(
      "read",
      { read: !props.item.feedback.readAt },
      "read update failed",
    );
  }

  return (
    <div>
      <h2>{props.item.title}</h2>
      <p>{props.item.description}</p>
      <a target="_blank" rel="noopener noreferrer" href={props.item.url}>
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
          state={Boolean(props.item.feedback.bookmarkedAt)}
          onToggle={handleToggleBookmark}
        />
        <ToggleAction
          label="read"
          state={Boolean(props.item.feedback.readAt)}
          onToggle={handleToggleRead}
        />
      </div>
    </div>
  );
}
