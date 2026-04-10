import { z } from "zod";
import type { SourceType } from "../types/CreateSourceInput.js";

const redditHosts = new Set(["reddit.com", "www.reddit.com", "old.reddit.com"]);

export const sourceTypeSchema = z.enum(["rss", "subreddit", "hn"]);

export const sourceNameSchema = z.string().trim().min(1, "name is required");

export const sourceUrlSchema = z
  .string()
  .trim()
  .min(1, "source url is required")
  .refine((value: string) => parseSourceUrl(value) !== null, {
    message: "source url must be a valid URL",
  });

export const createSourceDraftSchema = z
  .object({
    name: sourceNameSchema,
    url: sourceUrlSchema,
  })
  .superRefine((input: { name: string; url: string }, ctx) => {
    const type = inferSourceTypeFromUrl(input.url);

    if (!type) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "source url is currently not supported",
      });
    }
  })
  .transform((input: { name: string; url: string }) => {
    const type = inferSourceTypeFromUrl(input.url) as SourceType;

    return {
      name: input.name,
      type,
      url: normalizeSourceUrl(input.url, type),
    };
  });

export const createSourceRequestSchema = z
  .object({
    name: sourceNameSchema,
    url: sourceUrlSchema,
    type: sourceTypeSchema,
  })
  .superRefine((input: { name: string; url: string; type: SourceType }, ctx) => {
    const inferredType = inferSourceTypeFromUrl(input.url);

    if (!inferredType) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "source url is currently not supported",
      });
      return;
    }

    if (inferredType !== input.type) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "source type does not match source url",
      });
    }
  })
  .transform((input: { name: string; url: string; type: SourceType }) => ({
    name: input.name,
    type: input.type,
    url: normalizeSourceUrl(input.url, input.type),
  }));

export function inferSourceTypeFromUrl(url: string): SourceType | null {
  const parsedUrl = parseSourceUrl(url);

  if (!parsedUrl) {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();
  const search = parsedUrl.search.toLowerCase();

  if (hostname === "news.ycombinator.com") {
    return "hn";
  }

  if (redditHosts.has(hostname) && /^\/r\/[^/]+\/?$/.test(pathname)) {
    return "subreddit";
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

export function normalizeSourceUrl(url: string, type?: SourceType): string {
  const parsedUrl = parseSourceUrl(url);

  if (!parsedUrl) {
    throw new Error("cannot normalize invalid source url");
  }

  parsedUrl.hash = "";

  if (parsedUrl.pathname !== "/") {
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "") || "/";
  }

  if (type === "subreddit") {
    parsedUrl.search = "";
  }

  return parsedUrl.toString();
}

export function parseSourceUrl(url: string): URL | null {
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
