import { SourceType } from "@currit/shared/types/CreateSourceInput";
import db from "../../db";
import { sources } from "../../db/schema";
import normalizeSourceUrl from "./normalizeSourceUrl";

export async function createSource(
  name: string,
  url: string,
  type: SourceType,
) {
  await db.insert(sources).values({
    name: name,
    url: normalizeSourceUrl(url),
    type: type,
  });
}
