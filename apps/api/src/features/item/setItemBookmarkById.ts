import setItemFeedbackTimestampById from "./setItemFeedbackTimestampById";

export default async function setItemBookmarkById(
  id: string,
  newBookmarkState: boolean,
) {
  return setItemFeedbackTimestampById(id, "bookmarkedAt", newBookmarkState);
}
