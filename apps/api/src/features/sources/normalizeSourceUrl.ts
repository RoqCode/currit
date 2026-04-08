export default function normalizeSourceUrl(url: string) {
  const trimmedUrl = url.trim();

  try {
    const parsedUrl = new URL(trimmedUrl);

    parsedUrl.hash = "";

    if (parsedUrl.pathname !== "/") {
      parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "") || "/";
    }

    return parsedUrl.toString();
  } catch {
    return trimmedUrl;
  }
}
