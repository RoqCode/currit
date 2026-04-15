import type { ItemRow } from "../../db/schema";
const config = {
  globalWeight: 0.3,
  temperature: 1.0,
  freshnessHalfLifeHours: 72,
  samplingFloor: 0.01,
  minScorePercentileInSource: 0.7,
  weights: { score: 0.7, comments: 0.2 },
};

export type ScoredItemRow = ItemRow & {
  localScore: number;
  globalScore: number;
  preDecayScore: number;
  freshnessMultiplier: number;
  ageHours: number;
  normalizedScore: number;
  samplingWeight: number;
};

export default function scoreCandidates(items: ItemRow[]) {
  const scoredItems: ScoredItemRow[] = items.map((item) => ({
    ...item,
    localScore: 0,
    globalScore: 0,
    preDecayScore: 0,
    freshnessMultiplier: 1,
    ageHours: 0,
    normalizedScore: 0,
    samplingWeight: 0,
  }));

  const scoredCandidates = setLocalScorePerItem(scoredItems);
  setGlobalScorePerItem(scoredCandidates);
  setHybridScorePerItem(scoredCandidates);
  applyFreshnessDecay(scoredCandidates);
  setSamplingWeightPerItem(scoredCandidates);

  return scoredCandidates;
}

function setSamplingWeightPerItem(items: ScoredItemRow[]) {
  for (const item of items) {
    item.samplingWeight =
      (item.normalizedScore + config.samplingFloor) ** (1 / config.temperature);
  }
}

function setHybridScorePerItem(items: ScoredItemRow[]) {
  for (const item of items) {
    item.preDecayScore =
      config.globalWeight * item.globalScore +
      (1 - config.globalWeight) * item.localScore;

    item.normalizedScore = item.preDecayScore;
  }
}

function applyFreshnessDecay(items: ScoredItemRow[]) {
  const decayBase = Math.log(2) / config.freshnessHalfLifeHours;

  for (const item of items) {
    const ageMs = Date.now() - item.createdAt.getTime();
    const ageHours = Math.max(0, ageMs / (1000 * 60 * 60));
    const freshnessMultiplier = Math.exp(-decayBase * ageHours);

    item.ageHours = ageHours;
    item.freshnessMultiplier = freshnessMultiplier;
    item.normalizedScore = item.preDecayScore * freshnessMultiplier;
  }
}

function setGlobalScorePerItem(items: ScoredItemRow[]) {
  const logScores = items.map((item) => Math.log(1 + (item.itemScore ?? 0)));
  const logComments = items.map((item) =>
    Math.log(1 + (item.commentCount ?? 0)),
  );

  const [minLogScore, maxLogScore] = [
    Math.min(...logScores),
    Math.max(...logScores),
  ];

  const [minLogComments, maxLogComments] = [
    Math.min(...logComments),
    Math.max(...logComments),
  ];

  const scoreRange = maxLogScore - minLogScore;
  const commentRange = maxLogComments - minLogComments;

  for (const item of items) {
    const normLogScore =
      scoreRange === 0
        ? 0
        : (Math.log(1 + (item.itemScore ?? 0)) - minLogScore) / scoreRange;
    const normLogComments =
      commentRange === 0
        ? 0
        : (Math.log(1 + (item.commentCount ?? 0)) - minLogComments) /
          commentRange;

    item.globalScore =
      config.weights.score * normLogScore +
      config.weights.comments * normLogComments;
  }
}

function setLocalScorePerItem(items: ScoredItemRow[]) {
  const candidates: ScoredItemRow[] = [];
  const rowsBySource = new Map<string, ScoredItemRow[]>();

  for (const item of items) {
    if (item.sourceId === null) continue;
    rowsBySource.set(item.sourceId, [
      ...(rowsBySource.get(item.sourceId) ?? []),
      item,
    ]);
  }

  for (const [_sourceId, sourceItems] of rowsBySource) {
    const scoreRankInSource = percentileRank(sourceItems, "itemScore");

    const commentRankInSource = percentileRank(sourceItems, "commentCount");

    const shouldApplyMinScoreFilter = sourceItems.length > 1;

    for (const item of sourceItems) {
      if (
        shouldApplyMinScoreFilter &&
        scoreRankInSource.get(item.id)! < config.minScorePercentileInSource
      ) {
        continue;
      }
      item.localScore =
        config.weights.score * (scoreRankInSource.get(item.id) ?? 0) +
        config.weights.comments * (commentRankInSource.get(item.id) ?? 0);

      candidates.push(item);
    }
  }

  return candidates;
}

// returns map of <id, rank>
// rank = percentile rank inside given rows array
function percentileRank(rows: ItemRow[], by: "itemScore" | "commentCount") {
  const sorted = rows.sort(
    (a, b) => (a[by] ?? -Infinity) - (b[by] ?? -Infinity),
  );
  let count = sorted.length - 1;

  if (count === 0) count = 1;

  const ranksById = new Map<string, number>();
  for (let i = 0; i < sorted.length; i++) {
    ranksById.set(sorted[i].id, i / count);
  }

  return ranksById;
}
