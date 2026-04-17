import db from "../../db";
import { sources, type SourceType } from "../../db/schema";
import validateSourceUrl from "./validateSourceUrl";

export async function createSource(
  name: string,
  url: string,
  type: SourceType,
) {
  validateSourceUrl(url, type);

  await db.insert(sources).values({
    name: name,
    url: url,
    type: type,
  });
}
