import { decodeHTML } from "entities";

const MAX_SUMMARY_LENGTH = 280;

export default function normalizeFeedSummary(summary: string | null) {
  if (!summary) {
    return null;
  }

  const normalizedSummary = collapseWhitespace(
    stripFeedBoilerplate(stripHtmlTags(decodeHTML(summary))),
  );

  if (!normalizedSummary) {
    return null;
  }

  if (normalizedSummary.length <= MAX_SUMMARY_LENGTH) {
    return normalizedSummary;
  }

  return `${normalizedSummary.slice(0, MAX_SUMMARY_LENGTH - 1).trimEnd()}…`;
}

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function stripFeedBoilerplate(value: string) {
  return value.replace(/The post .*? appeared first on .*?\.?$/i, " ");
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
