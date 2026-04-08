import pollHnSource from "./pollHnSource";
import { pollRssSource } from "./pollRssSource";
import type { NormalizedItemInput } from "./types";
import { savePolledItems } from "./savePolledItems";
import pollSubredditSource from "./pollSubredditSource";
import { getActiveSources } from "../sources/getActiveSources";
import mapWithConcurrency from "./mapWithConcurrency";
import fetchHnTopStories from "./fetchHnTopStories";

export async function pollSources(): Promise<void> {
  const sources = await getActiveSources();

  if (sources.length < 1) {
    throw new Error("No viable Sources found");
  }
  const start = performance.now();

  const rssSources = sources.filter((source) => source.type === "rss");
  const subredditSources = sources.filter(
    (source) => source.type === "subreddit",
  );
  const hnSource = sources.find((source) => source.type === "hn");

  const [hnItems, rssItems, redditItems] = await Promise.all([
    pollHnSources(hnSource),
    pollRssSources(rssSources),
    pollSubredditSources(subredditSources),
  ]);

  const results: NormalizedItemInput[] = [
    ...hnItems,
    ...rssItems,
    ...redditItems,
  ];

  // TODO: normalize scores - only after hn and reddit - RSS Feeds cant be scored
  // normalizeItemScores(newItems)

  try {
    await savePolledItems({ items: results });
  } catch (e) {
    console.error(e);
    throw e;
  }
  const elapsed = ((performance.now() - start) / 1000).toFixed(4);
  console.log(`\nDone in ${elapsed}s`);
}

async function pollHnSources(
  hnSource: Awaited<ReturnType<typeof getActiveSources>>[number] | undefined,
): Promise<NormalizedItemInput[]> {
  if (!hnSource) return [];

  const hnTopPostIds = await fetchHnTopStories(hnSource);
  const hnItemsWithPossibleFailures = await mapWithConcurrency(
    hnTopPostIds,
    (itemId) => pollHnSource(hnSource.id, itemId),
    20,
  );

  return hnItemsWithPossibleFailures.filter((item) => item !== null);
}

async function pollRssSources(
  rssSources: Awaited<ReturnType<typeof getActiveSources>>,
): Promise<NormalizedItemInput[]> {
  const rssItemsWithPossibleFailures = await mapWithConcurrency(
    rssSources,
    pollRssSource,
    20,
  );

  return rssItemsWithPossibleFailures
    .filter((item) => item !== null)
    .flatMap((item) => item);
}

async function pollSubredditSources(
  subredditSources: Awaited<ReturnType<typeof getActiveSources>>,
): Promise<NormalizedItemInput[]> {
  const redditItemsWithPossibleFailures = await mapWithConcurrency(
    subredditSources,
    pollSubredditSource,
    5,
  );

  return redditItemsWithPossibleFailures
    .filter((item) => item !== null)
    .flatMap((item) => item);
}
