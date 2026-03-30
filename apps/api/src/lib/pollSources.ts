import { getAllSources } from "./getAllSources";
import { pollRssSource } from "./pollRssSource";
import type { PollSourceResult, PollSourcesResult } from "./pollTypes";

export async function pollSources(): Promise<PollSourcesResult> {
  const sources = await getAllSources();

  // TODO: Keep only the source types that this MVP can actually poll.
  // For now we only support RSS sources with a latest-item-only polling flow.
  const viableSources = sources.filter((source) => source.type === "rss");

  // TODO: Decide how to report the case where no pollable sources exist.
  if (viableSources.length < 1) {
    throw new Error("No viable Sources found");
  }

  // TODO: Run one polling job per source.
  // Start sequentially so the per-source decision logic stays easy to debug.

  const results: PollSourceResult[] = [];

  for (const source of viableSources) {
    switch (source.type) {
      case "rss":
        const pollSourceResult = await pollRssSource({ source });

        if (pollSourceResult.status === "error") {
          // do something?
        } else {
          results.push(pollSourceResult);
        }
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

  // TODO: Aggregate per-source results into one batch summary.
  // TODO: Return a summary object suitable for logs and the manual poll endpoint.
  void sources;
  void pollRssSource;
  throw new Error("TODO: implement pollSources");
}
