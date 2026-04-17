# Currit Todo

_Stand: April 2026_

## MVP Before Live

### Feedback

- [x] Add like endpoint and persistence
- [x] Add bookmark toggle endpoint and persistence
- [x] Add bookmarks list endpoint
- [x] Add like and bookmark actions to the frontend

### UI

- [ ] Replace current debug-heavy flow with a more product-like feed experience
- [ ] Improve empty, loading, and error states in the feed UI
- [ ] Improve source management usability after the active toggle exists
- [ ] Add source favorite toggle and show favored sources clearly in source management
- [ ] Optionally highlight feed items that came from favored sources
- [ ] Revisit mobile usability once the core loop feels stable

### Delivery / Ops

- [ ] Add linting for web and api
- [ ] Dockerize `apps/web` and `apps/api`
- [ ] Add production `docker-compose` setup for `db`, `api`, and `web`
- [ ] Add production scheduling for polling (4x per day via cron or equivalent)
- [ ] Add GitHub Actions pipeline for lint, typecheck, and build
- [ ] Build and publish Docker images from GitHub Actions
- [ ] Add homelab deploy flow that pulls the latest images and restarts services
- [ ] Define production env and secret handling for the homelab server

### Runtime / Reliability

- [ ] Replace the current minimal `/health` response with meaningful health reporting
- [ ] Split liveness vs readiness checks if needed
- [ ] Include database health in readiness reporting
- [ ] Decide whether polling freshness or last successful poll should be exposed in status reporting
- [ ] Define a basic PostgreSQL backup and restore approach for production

## Post-MVP Hardening

- [ ] Add a small E2E smoke test for the core user flow
- [ ] Add focused unit tests for ranking and feed-building logic
- [ ] Do a first security pass: input validation, safe defaults, dependency review, and basic abuse protection
- [ ] Add Renovate
- [ ] Add Sentry for frontend and backend
- [ ] Add metrics/dashboarding if runtime visibility becomes a real pain point

## Later Learning Tracks

- [ ] Explore offline/PWA support with cached daily feed and deferred sync
- [ ] Rewrite the backend in Go after the TypeScript MVP is stable

## Notes

- MVP hosting target is a homelab server running three Docker containers: `db`, `api`, and `web`
- Prefer CI-built images over local builds so the deploy artifact is reproducible
- Keep application secrets out of Git, build artifacts, and Docker images; provide them only at runtime on the homelab server
- Performance matters now because polling currently takes about 30 seconds for roughly 12 sources
- Performance work should optimize for controlled orchestration, not maximum parallelism
- Reddit should stay conservative to reduce rate-limit and blacklist risk; for the MVP we log rate-limit errors and skip all remaining Reddit fetches for that run instead of retrying
- Keywords are intentionally postponed; the first product test should answer whether source selection + ranking + a finite feed already has enough pull
- Current ranking baseline is intentionally light: freshness + source-local quality + per-source cap for Reddit/HN, plus semi-random source selection and an RSS serendipity slice
- Add source favoritism as an explicit ranking signal; favored sources should get a ranking boost
- Favored RSS sources are a special product rule: new items should always make it into the daily feed up to a per-source/day safety cap, even if that temporarily pushes the feed above its normal size limit
