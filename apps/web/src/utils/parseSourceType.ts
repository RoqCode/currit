import type { SourceType } from "@currit/shared/types/CreateSourceInput";

function normalizeUrl(url: string): URL | null {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return null;
  }

  try {
    return new URL(trimmedUrl);
  } catch {
    try {
      return new URL(`https://${trimmedUrl}`);
    } catch {
      return null;
    }
  }
}

export function parseSourceType(url: string): SourceType | null {
  const parsedUrl = normalizeUrl(url);

  if (!parsedUrl) {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();
  const search = parsedUrl.search.toLowerCase();

  if (hostname === "news.ycombinator.com") {
    return "hn";
  }

  if (hostname === "reddit.com" || hostname.endsWith(".reddit.com")) {
    const isSubredditPath = /^\/r\/[^/]+\/?$/.test(pathname);

    if (isSubredditPath) {
      return "subreddit";
    }
  }

  const looksLikeRssFeed =
    /(?:^|\/)(?:feed|feeds|rss|atom)(?:\/|$)/.test(pathname) ||
    /\.(?:rss|xml|atom)$/.test(pathname) ||
    /(format|type|output)=rss/.test(search) ||
    /feed=(?:rss|atom)/.test(search);

  if (looksLikeRssFeed) {
    return "rss";
  }

  return null;
}
