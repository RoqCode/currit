import type { Atom, DeepPartial, Rdf, Rss } from "feedsmith/types";
import type { NormalizedRSSItem } from "./types";
import {
  getFirstString,
  getFirstUrl,
  normalizeItemUrl,
  parseDateString,
} from "./rssNormalizationUtils";

export type NormalizedFeedItemsResult = {
  items: NormalizedRSSItem[];
  fetchedCount: number;
  failedItemCount: number;
};

export function normalizeFeedItems<T>(
  entries: T[],
  normalizeEntry: (entry: T) => NormalizedRSSItem | null,
): NormalizedFeedItemsResult {
  const items: NormalizedRSSItem[] = [];
  let failedItemCount = 0;

  for (const entry of entries) {
    const normalizedItem = normalizeEntry(entry);

    if (!normalizedItem) {
      failedItemCount += 1;
      continue;
    }

    items.push(normalizedItem);
  }

  return {
    items,
    fetchedCount: entries.length,
    failedItemCount,
  };
}

export function normalizeRssItem(
  item: DeepPartial<Rss.Item<string>>,
): NormalizedRSSItem | null {
  const title = item.title?.trim() || "Untitled RSS item";
  const description = getFirstString(item.description, item.dc?.description);
  const url = getFirstUrl(
    item.link,
    item.guid?.isPermaLink === false ? null : item.guid?.value,
  );
  const author = getFirstString(
    getFirstRssAuthor(item.authors),
    item.dc?.creator,
  );
  const publishedAt =
    parseDateString(item.pubDate, item.dc?.date, item.dcterms?.created) ??
    new Date();

  if (!url) {
    return null;
  }

  return {
    title,
    description,
    url,
    publishedAt,
    author,
  };
}

export function normalizeAtomEntry(
  entry: DeepPartial<Atom.Entry<string>>,
): NormalizedRSSItem | null {
  const title = entry.title?.trim() || "Untitled RSS item";
  const description = getFirstString(
    entry.summary,
    entry.content,
    entry.dc?.description,
  );
  const url = getAtomEntryUrl(entry.links);
  const author = getAtomAuthor(entry.authors);
  const publishedAt =
    parseDateString(entry.published, entry.updated, entry.dc?.date) ??
    new Date();

  if (!url) {
    return null;
  }

  return {
    title,
    description,
    url,
    publishedAt,
    author,
  };
}

export function normalizeRdfItem(
  item: DeepPartial<Rdf.Item<string>>,
): NormalizedRSSItem | null {
  const title = item.title?.trim() || "Untitled RSS item";
  const description = getFirstString(item.description, item.dc?.description);
  const url = getFirstUrl(item.link);
  const author = getFirstString(item.dc?.creator);
  const publishedAt =
    parseDateString(item.dc?.date, item.dcterms?.created) ?? new Date();

  if (!url) {
    return null;
  }

  return {
    title,
    description,
    url,
    publishedAt,
    author,
  };
}

function getAtomEntryUrl(
  links: DeepPartial<Array<Atom.Link<string>>> | undefined,
) {
  if (!links?.length) {
    return null;
  }

  for (const link of links) {
    if (!link?.href) continue;
    if (link.rel === undefined || link.rel === "alternate") {
      const normalizedUrl = normalizeItemUrl(link.href);

      if (normalizedUrl) {
        return normalizedUrl;
      }
    }
  }

  for (const link of links) {
    const normalizedUrl = link?.href ? normalizeItemUrl(link.href) : null;

    if (normalizedUrl) {
      return normalizedUrl;
    }
  }

  return null;
}

function getAtomAuthor(authors: DeepPartial<Array<Atom.Person>> | undefined) {
  if (!authors?.length) {
    return null;
  }

  for (const author of authors) {
    const name = getFirstString(author?.name);

    if (name) {
      return name;
    }
  }

  return null;
}

function getFirstRssAuthor(
  authors: DeepPartial<Array<Rss.PersonLike>> | undefined,
) {
  if (!authors?.length) {
    return null;
  }

  for (const author of authors) {
    if (typeof author === "string") {
      const normalizedAuthor = getFirstString(author);

      if (normalizedAuthor) {
        return normalizedAuthor;
      }
    }

    if (author && typeof author === "object" && "name" in author) {
      const normalizedAuthor = getFirstString(author.name);

      if (normalizedAuthor) {
        return normalizedAuthor;
      }
    }
  }

  return null;
}
