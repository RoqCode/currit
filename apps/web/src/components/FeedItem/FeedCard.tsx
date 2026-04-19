import {
  patchItemFeedbackResponseSchema,
  type FeedItem,
} from "@currit/shared/types/Feed";
import ToggleAction from "./ToggleAction";
import PostLink from "./PostLink";
import CardTag from "./CardTag";

type FeedCardItem = Pick<
  FeedItem,
  "id" | "title" | "description" | "url" | "feedback" | "type" | "sourceName"
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
    if (props.item.feedback.readAt) return;

    await patchFeedback(
      "read",
      { read: !props.item.feedback.readAt },
      "read update failed",
    );
  }

  return (
    <div
      className={`bg-surface font-sans p-4 ${props.item.feedback.readAt ? "outline-2 outline-primary" : ""}`}
    >
      <CardTag
        sourceType={props.item.type}
        sourceName={props.item.sourceName}
      />
      <h2 className="text-text text-xl font-bold">{props.item.title}</h2>
      <p className="text-base">{props.item.description}</p>

      <div className="flex justify-between mt-4 items-center">
        <div className="flex gap-2">
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
        </div>
        <PostLink url={props.item.url} handleRead={handleToggleRead} />

        {/*        <ToggleAction
          label="read"
          state={Boolean(props.item.feedback.readAt)}
          onToggle={handleToggleRead}
        />*/}
      </div>
    </div>
  );
}
