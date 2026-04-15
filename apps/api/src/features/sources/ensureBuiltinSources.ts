import { normalizeSourceUrl } from "@currit/shared/validation/sourceInput";
import db from "../../db";
import { sources } from "../../db/schema";

type BuiltinSourceSeed = Pick<
  typeof sources.$inferInsert,
  "name" | "type" | "url" | "isBuiltin"
>;

const builtinSources: BuiltinSourceSeed[] = [
  {
    name: "HackerNews",
    type: "hn",
    url: "https://news.ycombinator.com/",
    isBuiltin: true,
  },
];

export default async function ensureBuiltinSources() {
  const rows = await db.select().from(sources);

  const missingSources = builtinSources.filter((builtin) => {
    if (builtin.type === "hn") {
      return !rows.some((row) => row.type === "hn");
    }

    const normalizedBuiltinUrl = normalizeSourceUrl(builtin.url, builtin.type);

    return !rows.some((row) => {
      return row.type === builtin.type && row.url === normalizedBuiltinUrl;
    });
  });

  if (missingSources.length > 0) {
    await insertBuiltinSources(missingSources);
  }
}

async function insertBuiltinSources(missingSources: BuiltinSourceSeed[]) {
  await db.insert(sources).values(
    missingSources.map((source) => ({
      ...source,
      url: normalizeSourceUrl(source.url, source.type),
    })),
  );
}
