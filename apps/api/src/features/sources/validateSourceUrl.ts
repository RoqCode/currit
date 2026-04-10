import { isIP } from "node:net";
import type { SourceType } from "@currit/shared/types/CreateSourceInput";
import { parseSourceUrl } from "@currit/shared/validation/sourceInput";

const REDDIT_HOSTS = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
]);

export class InvalidSourceUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSourceUrlError";
  }
}

export default function validateSourceUrl(url: string, type: SourceType): string {
  const parsedUrl = parseSourceUrl(url);

  if (!parsedUrl) {
    throw new InvalidSourceUrlError("source url must be a valid URL");
  }

  if (!isAllowedProtocol(parsedUrl.protocol)) {
    throw new InvalidSourceUrlError("source url must use http or https");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new InvalidSourceUrlError("source url must not include credentials");
  }

  if (isPrivateHostname(parsedUrl.hostname)) {
    throw new InvalidSourceUrlError("source url must point to a public host");
  }

  if (type === "subreddit") {
    if (!REDDIT_HOSTS.has(parsedUrl.hostname)) {
      throw new InvalidSourceUrlError("subreddit sources must use a reddit.com URL");
    }

    if (!/^\/r\/[^/]+\/?$/i.test(parsedUrl.pathname)) {
      throw new InvalidSourceUrlError(
        "subreddit sources must look like https://www.reddit.com/r/name",
      );
    }
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

function isAllowedProtocol(protocol: string) {
  return protocol === "http:" || protocol === "https:";
}

function isPrivateHostname(hostname: string) {
  const normalizedHost = hostname.toLowerCase();

  if (normalizedHost === "localhost") return true;
  if (normalizedHost.endsWith(".local")) return true;

  const ipVersion = isIP(normalizedHost);

  if (ipVersion === 4) {
    return isPrivateIpv4(normalizedHost);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6(normalizedHost);
  }

  return false;
}

function isPrivateIpv4(address: string) {
  const [first, second] = address.split(".").map(Number);

  if (first === 10) return true;
  if (first === 127) return true;
  if (first === 0) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;

  return false;
}

function isPrivateIpv6(address: string) {
  const normalizedAddress = address.toLowerCase();

  return (
    normalizedAddress === "::1" ||
    normalizedAddress.startsWith("fc") ||
    normalizedAddress.startsWith("fd") ||
    normalizedAddress.startsWith("fe80:")
  );
}
