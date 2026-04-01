import { getAllSources } from "../sources/getAllSources";
import pollHnSource from "./pollHnSource";
import { pollRssSource } from "./pollRssSource";
import type { NormalizedItemInput } from "./types";
import { savePolledItems } from "./savePolledItems";

export async function pollSources(): Promise<void> {
  const sources = await getAllSources();

  const viableSources = sources.filter(
    (source) => source.type === "rss" || source.type === "hn",
  );

  if (viableSources.length < 1) {
    throw new Error("No viable Sources found");
  }

  const results: NormalizedItemInput[] = [];

  for (const source of viableSources) {
    switch (source.type) {
      case "rss":
        const newRSSItems = await pollRssSource({ source });

        if (newRSSItems?.length) results.push(...newRSSItems);

        break;
      case "subreddit":
        console.warn(
          "source of type 'subreddit' is not supported at the moment",
        );
        break;
      case "hn":
        const newHNItems = await pollHnSource({ source });

        if (newHNItems?.length) results.push(...newHNItems);

        break;
      default:
        console.error("unknown source type:", source.type, source);
        break;
    }
  }
  // TODO: normalize scores - only after hn and reddit - RSS Feeds cant be scored
  // normalizeItemScores(newItems)

  try {
    await savePolledItems({ items: results });
  } catch (e) {
    console.error(e);
    throw e;
  }
}
