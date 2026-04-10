export function getFirstString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value !== "string") continue;

    const trimmedValue = value.trim();

    if (trimmedValue) {
      return trimmedValue;
    }
  }

  return null;
}

export function getFirstUrl(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (!value) continue;

    const normalizedUrl = normalizeItemUrl(value);

    if (normalizedUrl) {
      return normalizedUrl;
    }
  }

  return null;
}

export function normalizeItemUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url.trim());

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    parsedUrl.hash = "";

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function parseDateString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (!value) continue;

    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null;
}
