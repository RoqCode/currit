import setItemFeedbackTimestampById from "./setItemFeedbackTimestampById";

export default async function setItemLikeById(
  id: string,
  newLikeState: boolean,
) {
  return setItemFeedbackTimestampById(id, "likedAt", newLikeState);
}
