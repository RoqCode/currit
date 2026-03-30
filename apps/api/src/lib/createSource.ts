import { SourceType } from "@currit/shared/types/CreateSourceInput";
import db from "../db";
import { sources } from "../db/schema";

export async function createSource(
  name: string,
  url: string,
  type: SourceType,
) {
  await db.insert(sources).values({ name: name, url: url, type: type });
}
