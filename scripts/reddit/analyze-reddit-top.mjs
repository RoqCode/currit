import { readFileSync } from "node:fs";
import process from "node:process";

const filePath = process.argv[2] ?? "./scripts/reddit/reddit_top.txt";

const FEED_SIZE = 7;
const MAX_PER_SOURCE = 2;
const SIMULATION_DAYS = 700;
const TEMPERATURE = 1.0;

const raw = readFileSync(filePath, "utf8");
const subreddits = parseRedditTopFile(raw);

const totalPosts = [...subreddits.values()].reduce((s, p) => s + p.length, 0);
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║        HYBRID WEIGHT SWEEP — global:local ratio        ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\n  ${totalPosts} posts, ${subreddits.size} subs, ${SIMULATION_DAYS} days, feed=${FEED_SIZE}, cap=${MAX_PER_SOURCE}\n`);

// ── Sweep global weight from 0.0 to 0.6 ─────────────────────────
const globalWeights = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
const allResults = [];

for (const gw of globalWeights) {
  const pool = buildHybridPool(subreddits, gw);
  const result = simulate(pool, subreddits);
  allResults.push({ gw, ...result });
}

// ── Compact comparison table ─────────────────────────────────────
console.log("═".repeat(70));
console.log("  OVERVIEW: how global weight affects fairness & quality");
console.log("═".repeat(70));

const overviewRows = allResults.map((r) => ({
  weight: `${(r.gw * 100).toFixed(0)}g:${((1 - r.gw) * 100).toFixed(0)}l`,
  gini: r.gini.toFixed(3),
  fairness: barChart((1 - r.gini) * 100, 15, 100),
  subsPerWeek: r.avgSubsPerWeek.toFixed(1),
  topSubShare: `${r.topSubShare.toFixed(1)}%`,
  bottomSubShare: `${r.bottomSubShare.toFixed(1)}%`,
  spread: `${r.spreadRatio.toFixed(1)}x`,
}));
console.table(overviewRows);

// ── Per-subreddit detail across weights ──────────────────────────
// Focus on interesting subs: a big one, a mid one, some small ones
const focusSubs = [
  "funny", "mildlyinfuriating", "technology", "todayilearned",
  "programming", "webdev", "selfhosted", "homelab", "dataisbeautiful",
  "javascript", "node", "neovim", "commandline", "opencodeCLI",
  "ExperiencedDevs", "typescript", "web_design",
  "InternetIsBeautiful", "userexperience", "badUIbattles", "FullStack", "linux",
];

console.log("\n" + "═".repeat(90));
console.log("  PER-SUBREDDIT FEED SHARE across weights");
console.log("═".repeat(90));
console.log("");

// Header
const colHeaders = globalWeights.map((gw) => `${(gw * 100).toFixed(0)}:${((1 - gw) * 100).toFixed(0)}`.padStart(7)).join("");
console.log(`  ${"subreddit".padEnd(24)} ${colHeaders}    ${"range".padStart(10)}  0:100 share`);
console.log("  " + "─".repeat(86));

for (const sub of focusSubs) {
  const posts = subreddits.get(sub);
  if (!posts) continue;
  const scores = posts.map((p) => p.score).sort((a, b) => a - b);
  const scoreTag = `${abbrev(scores[0])}–${abbrev(scores[scores.length - 1])}`.padStart(10);

  const shares = allResults.map((r) => {
    const share = r.subShares.get(sub) ?? 0;
    return `${(share * 100).toFixed(1)}%`.padStart(7);
  }).join("");

  // Bar based on the 0:100 (pure local) share for visual comparison
  const baseShare = (allResults[0].subShares.get(sub) ?? 0) * 100;
  const bar = barChart(baseShare, 14);

  console.log(`  r/${sub.padEnd(20)} ${shares}    ${scoreTag}  ${bar}`);
}

// Visual legend
console.log("");
console.log("  Bar = feed share at 0:100 (pure local percentile). Full bar ≈ 6%.");

// ── Show example feeds for the most interesting weight ────────────
console.log("\n\n" + "═".repeat(70));
console.log("  EXAMPLE FEEDS — 3 weights side by side");
console.log("═".repeat(70));

for (const gw of [0.0, 0.2, 0.4]) {
  const pool = buildHybridPool(subreddits, gw);
  console.log(`\n  ── global:local = ${(gw * 100).toFixed(0)}:${((1 - gw) * 100).toFixed(0)} ${"─".repeat(49)}`);
  for (let run = 1; run <= 3; run++) {
    const feed = weightedSample(pool, FEED_SIZE, MAX_PER_SOURCE, TEMPERATURE);
    printFeed(`Day ${run}`, feed);
  }
}

// ═══════════════════════════════════════════════════════════════════
// POOL BUILDERS
// ═══════════════════════════════════════════════════════════════════

function buildHybridPool(subreddits, globalWeight) {
  const localWeight = 1 - globalWeight;
  const all = allPosts(subreddits);

  // Global log scores
  const logScores = all.map((p) => Math.log1p(p.score));
  const logComments = all.map((p) => Math.log1p(p.num_comments));
  const [minLS, maxLS] = [Math.min(...logScores), Math.max(...logScores)];
  const [minLC, maxLC] = [Math.min(...logComments), Math.max(...logComments)];

  const globalMap = new Map();
  for (const post of all) {
    const ls = (Math.log1p(post.score) - minLS) / (maxLS - minLS || 1);
    const lc = (Math.log1p(post.num_comments) - minLC) / (maxLC - minLC || 1);
    globalMap.set(post.id, 0.7 * ls + 0.2 * lc + 0.1 * (post.upvote_ratio ?? 0));
  }

  // Local percentile scores
  const results = [];
  for (const [subreddit, posts] of subreddits.entries()) {
    const scorePcts = buildPercentileMap(posts, (p) => p.score ?? 0);
    const commentPcts = buildPercentileMap(posts, (p) => p.num_comments ?? 0);
    for (const post of posts) {
      const localScore = 0.7 * (scorePcts.get(post.id) ?? 0) + 0.2 * (commentPcts.get(post.id) ?? 0) + 0.1 * (post.upvote_ratio ?? 0);
      results.push({
        ...pick(post),
        subreddit,
        normalizedScore: globalWeight * (globalMap.get(post.id) ?? 0) + localWeight * localScore,
      });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════
// SIMULATION
// ═══════════════════════════════════════════════════════════════════

function simulate(pool, subreddits) {
  const subAppearances = new Map();
  const weeklySubPresence = [];

  for (let day = 0; day < SIMULATION_DAYS; day++) {
    const feed = weightedSample(pool, FEED_SIZE, MAX_PER_SOURCE, TEMPERATURE);
    for (const post of feed) {
      subAppearances.set(post.subreddit, (subAppearances.get(post.subreddit) ?? 0) + 1);
    }
    const weekIdx = Math.floor(day / 7);
    if (!weeklySubPresence[weekIdx]) weeklySubPresence[weekIdx] = new Set();
    for (const post of feed) weeklySubPresence[weekIdx].add(post.subreddit);
  }

  const totalSlots = SIMULATION_DAYS * FEED_SIZE;
  const subShares = new Map();
  for (const sub of subreddits.keys()) {
    subShares.set(sub, (subAppearances.get(sub) ?? 0) / totalSlots);
  }

  const shares = [...subShares.values()].sort((a, b) => b - a);
  const avgSubsPerWeek = weeklySubPresence.reduce((s, w) => s + w.size, 0) / weeklySubPresence.length;

  return {
    gini: gini(shares),
    avgSubsPerWeek,
    topSubShare: shares[0] * 100,
    bottomSubShare: shares[shares.length - 1] * 100,
    spreadRatio: shares[0] / (shares[shares.length - 1] || 0.001),
    subShares,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SAMPLING
// ═══════════════════════════════════════════════════════════════════

function weightedSample(posts, n, maxPerSource, temperature) {
  const weights = posts.map((p) => Math.pow(p.normalizedScore + 0.05, 1 / temperature));
  const selected = [];
  const sourceCounts = new Map();
  const available = posts.map((_, i) => i);

  while (selected.length < n && available.length > 0) {
    const eligible = available.filter((i) => (sourceCounts.get(posts[i].subreddit) ?? 0) < maxPerSource);
    if (eligible.length === 0) break;

    const eligibleWeights = eligible.map((i) => weights[i]);
    const totalWeight = eligibleWeights.reduce((s, w) => s + w, 0);
    let r = Math.random() * totalWeight;
    let pickedIdx = eligible[0];
    for (let j = 0; j < eligible.length; j++) {
      r -= eligibleWeights[j];
      if (r <= 0) { pickedIdx = eligible[j]; break; }
    }

    selected.push(posts[pickedIdx]);
    sourceCounts.set(posts[pickedIdx].subreddit, (sourceCounts.get(posts[pickedIdx].subreddit) ?? 0) + 1);
    available.splice(available.indexOf(pickedIdx), 1);
  }
  return selected;
}

// ═══════════════════════════════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════════════════════════════

function printFeed(label, feed) {
  const sources = [...new Set(feed.map((p) => p.subreddit))];
  console.log(`\n    ┌─ ${label} ${"─".repeat(Math.max(0, 59 - label.length))}┐`);
  for (const item of feed) {
    const sub = `r/${item.subreddit}`.padEnd(22);
    const raw = `↑${abbrev(item.score)}`.padStart(7);
    const comments = `💬${abbrev(item.num_comments)}`.padStart(6);
    console.log(`    │  ${sub} ${raw}  ${comments}`.padEnd(66) + " │");
    console.log(`    │  ${truncate(item.title, 60)}`.padEnd(66) + " │");
  }
  console.log(`    │`.padEnd(66) + " │");
  console.log(`    │  ${sources.length} sources`.padEnd(66) + " │");
  console.log(`    └${"─".repeat(65)}┘`);
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function parseRedditTopFile(input) {
  const lines = input.split(/\r?\n/);
  const subreddits = new Map();
  let cur = null, objLines = [], depth = 0;
  for (const line of lines) {
    const m = line.match(/^===\s+r\/(.+?)\s+===$/);
    if (m) { cur = m[1]; if (!subreddits.has(cur)) subreddits.set(cur, []); continue; }
    if (!cur) continue;
    if (depth === 0 && line.trim().startsWith("{")) objLines = [];
    if (depth > 0 || line.trim().startsWith("{")) {
      objLines.push(line);
      for (const c of line) { if (c === "{") depth++; if (c === "}") depth--; }
      if (depth === 0 && objLines.length > 0) { try { subreddits.get(cur).push(JSON.parse(objLines.join("\n"))); } catch {} objLines = []; }
    }
  }
  return subreddits;
}

function allPosts(subreddits) {
  const all = [];
  for (const [sub, posts] of subreddits.entries()) for (const p of posts) all.push({ ...p, subreddit: sub });
  return all;
}

function pick(post) {
  return { id: post.id, title: post.title, score: post.score, num_comments: post.num_comments, upvote_ratio: post.upvote_ratio };
}

function buildPercentileMap(posts, getValue) {
  const sorted = [...posts].sort((a, b) => getValue(a) - getValue(b));
  const d = Math.max(sorted.length - 1, 1);
  const map = new Map();
  sorted.forEach((post, i) => map.set(post.id, i / d));
  return map;
}

function gini(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const m = sorted.reduce((s, v) => s + v, 0) / n;
  if (m === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sum += Math.abs(sorted[i] - sorted[j]);
  return sum / (2 * n * n * m);
}

function barChart(pct, width, maxPct = 6) {
  const filled = Math.round((pct / maxPct) * width);
  return "█".repeat(Math.min(Math.max(filled, 0), width)) + "░".repeat(Math.max(width - Math.max(filled, 0), 0));
}

function abbrev(n) {
  if (typeof n !== "number") return "0";
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function truncate(v, max) { if (typeof v !== "string") return ""; return v.length <= max ? v : v.slice(0, max - 3) + "..."; }
