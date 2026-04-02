# Currit Todo

_Stand: April 2026_

## Now

- [ ] Add `active` flag to `sources` schema and migration
- [ ] Treat Hacker News as a built-in default source instead of a normal user-created source
- [ ] Add backend support for toggling source activity (`PATCH /api/sources/:id/active`)
- [ ] Add source active toggle to the web UI

## Next

- [ ] Refactor polling orchestration to use controlled concurrency instead of fully sequential polling
- [ ] Group polling by source type and define separate concurrency rules for RSS, HN, and Reddit
- [ ] Add per-source poll result logging: duration, status, inserted count, skipped count, error type
- [ ] Add safer Reddit polling behavior with basic retry/backoff and rate-limit awareness

## After That

- [ ] Harden feed parsing for real-world RSS and Atom feeds
- [ ] Improve polling error handling so one broken source does not degrade the whole run
- [ ] Revisit duplicate handling for RSS URLs and rough normalization gaps between source types

## Ranking

- [ ] Implement first non-keyword scoring pass
- [ ] Start with freshness + source-local quality signals + simple diversity constraints
- [ ] Replace fixed feed bucket selection in `apps/api/src/features/feed/buildFeed.ts` with ranked selection
- [ ] Keep source selection as the main interest signal for the first product test

## Feedback

- [ ] Add like endpoint and persistence
- [ ] Add bookmark toggle endpoint and persistence
- [ ] Add bookmarks list endpoint
- [ ] Add like and bookmark actions to the frontend

## UI

- [ ] Replace current debug-heavy flow with a more product-like feed experience
- [ ] Improve empty, loading, and error states in the feed UI
- [ ] Improve source management usability after the active toggle exists
- [ ] Revisit mobile usability once the core loop feels stable

## Notes

- Performance matters now because polling currently takes about 30 seconds for roughly 12 sources
- Performance work should optimize for controlled orchestration, not maximum parallelism
- Reddit should stay conservative to reduce rate-limit and blacklist risk
- Keywords are intentionally postponed; the first product test should answer whether source selection + ranking + a finite feed already has enough pull
