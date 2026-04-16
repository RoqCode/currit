import setItemFeedbackTimestampById from "./setItemFeedbackTimestampById";

export default async function setItemReadById(
  id: string,
  newReadState: boolean,
) {
  return setItemFeedbackTimestampById(id, "readAt", newReadState);
}
