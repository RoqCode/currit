import { CreateSourceInput } from "@currit/shared/types/CreateSourceInput";
import db from "../../db";
import { sources } from "../../db/schema";
import { eq } from "drizzle-orm";

const builtinSources: CreateSourceInput[] = [
  {
    name: "HackerNews",
    type: "hn",
    url: "https://news.ycombinator.com/",
    isBuiltin: true,
  },
];

export default async function ensureBuiltinSources() {
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.isBuiltin, true));

  const missingSources = builtinSources.filter((builtin) => {
    return !rows.some((row) => {
      return row.type === builtin.type && row.url === builtin.url;
    });
  });

  if (missingSources.length > 0) {
    await insertBuiltinSources(missingSources);
  }
}

async function insertBuiltinSources(missingSources: CreateSourceInput[]) {
  await db.insert(sources).values(missingSources);
}
