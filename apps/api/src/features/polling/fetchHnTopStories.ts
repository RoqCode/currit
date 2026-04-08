import buildUserAgent from "@currit/shared/utils/buildUserAgent";
import { getAllSources } from "../sources/getAllSources";
import { updateSource } from "../sources/updateSource";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

export default async function fetchHnTopStories(
  source: SourceRow,
): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": buildUserAgent(),
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const jsonBody = await res.json();
    const items = (jsonBody as number[]).slice(0, 20);

    const now = new Date(Date.now());
    if (!source.lastCollectedFrom || items.length >= 1) {
      await updateSource({
        sourceId: source.id,
        lastPolledFrom: now,
        lastCollectedFrom: now,
      });

      return items;
    } else {
      await updateSource({
        sourceId: source.id,
        lastPolledFrom: now,
      });

      return items;
    }
  } catch (e) {
    console.error("error while fetching hackernews topstories", e);
    // TODO: handle error
  } finally {
    clearTimeout(timeout);
  }

  return [];
}
