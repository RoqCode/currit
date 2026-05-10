import {
  patchItemFeedbackResponseSchema,
  type FeedItem,
} from "@currit/shared/types/Feed";
import ToggleAction from "./ToggleAction";
import PostLink from "./PostLink";
import CardTag from "./CardTag";

const descriptionMaxLength = 220;

type FeedCardItem = Pick<
  FeedItem,
  "id" | "title" | "description" | "url" | "feedback" | "type" | "sourceName"
>;

type Props = {
  item: FeedCardItem;
  onUpdateFeedback?: (itemId: string, feedback: FeedItem["feedback"]) => void;
};

export default function FeedCard(props: Props) {
  const description = getVisibleDescription(
    props.item.type,
    props.item.description,
  );

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
      className={`border bg-surface p-5 font-ui transition-colors ${props.item.feedback.readAt ? "border-2 border-primary" : "border-border"}`}
    >
      <CardTag
        sourceType={props.item.type}
        sourceName={props.item.sourceName}
      />
      <h2 className="text-xl font-bold leading-tight text-text">
        {props.item.title}
      </h2>
      {description ? (
        <p className="mt-3 font-reading text-base leading-relaxed text-text">
          {description}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
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
        <PostLink
          url={props.item.url}
          isRead={Boolean(props.item.feedback.readAt)}
          handleRead={handleToggleRead}
        />
      </div>
    </div>
  );
}

function getVisibleDescription(
  type: FeedCardItem["type"],
  description: FeedCardItem["description"],
) {
  if (!description || type === "hn") return null;

  const trimmedDescription = description.trim();

  if (trimmedDescription.length <= descriptionMaxLength) {
    return trimmedDescription;
  }

  return `${trimmedDescription.slice(0, descriptionMaxLength).trimEnd()}...`;
}
