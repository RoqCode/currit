import { getAllSources } from "../sources/getAllSources";
import pollHnSource from "./pollHnSource";
import { pollRssSource } from "./pollRssSource";
import type { NormalizedItemInput } from "./types";
import { savePolledItems } from "./savePolledItems";
import pollSubredditSource from "./pollSubredditSource";

export async function pollSources(): Promise<void> {
  const sources = await getAllSources();

  if (sources.length < 1) {
    throw new Error("No viable Sources found");
  }

  const results: NormalizedItemInput[] = [];

  for (const source of sources) {
    switch (source.type) {
      case "rss":
        const newRSSItems = await pollRssSource({ source });

        if (newRSSItems?.length) results.push(...newRSSItems);

        break;
      case "subreddit":
        const newSubredditItems = await pollSubredditSource({ source });

        if (newSubredditItems?.length) results.push(...newSubredditItems);

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
