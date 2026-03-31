import buildFeed from "./buildFeed";
import { getAllSources } from "./getAllSources";
import { pollRssSource } from "./pollRssSource";
import type { NormalizedItemInput, PollSourcesResult } from "./pollTypes";
import { savePolledItems } from "./savePolledItems";

export async function pollSources(): Promise<void> {
  const sources = await getAllSources();

  const viableSources = sources.filter((source) => source.type === "rss");

  if (viableSources.length < 1) {
    throw new Error("No viable Sources found");
  }

  const results: NormalizedItemInput[] = [];

  for (const source of viableSources) {
    switch (source.type) {
      case "rss":
        const newItems = await pollRssSource({ source });

        if (newItems?.length) results.push(...newItems);

        break;
      case "subreddit":
        console.warn(
          "source of type 'subreddit' is not supported at the moment",
        );
        break;
      case "hn":
        console.warn("source of type 'HN' is not supported at the moment");
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

  try {
    await buildFeed();
  } catch (e) {
    console.error(e);
    throw e;
  }
}
