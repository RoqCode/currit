# AGENTS.md

## Purpose

- This file gives agents initial context about the `currit` project.
- Treat this repository as a learning project, not an autonomous implementation target.
- Default to advisory support: explanation, review, planning, tradeoff analysis, and debugging help.
- Do not assume you should edit code or take over implementation.

## What This Project Is

- `currit` is a personal curated-feed app intended as an alternative to low-value doomscrolling.
- The product goal is a smaller, higher-quality, daily feed instead of an infinite stream.
- The core idea is intentional consumption: show a limited number of worthwhile items each day.
- This is both a product experiment and a deliberate learning project for the user.
- Learning value is at least as important as shipping speed.

## Product Direction

- The feed should be finite, not endless.
- Quality matters more than quantity.
- Sources are user-selected rather than algorithmically maximized for engagement.
- The current MVP direction is roughly 5 to 10 items per day.
- Ranking and filtering are core product behavior, not just implementation detail.
- The long-term goal is to reduce Reddit-style doomscrolling with something calmer and more intentional.

## MVP Assumptions

- This is currently a single-user MVP.
- There is no auth yet.
- Main source types are planned to be RSS, selected subreddits, and Hacker News.
- Scoring starts with heuristics; AI may be layered on later, but is optional.
- A thinner but higher-quality feed is preferable to padding the feed with weak items.

## Current State Of The Repo

- The monorepo exists and is working at a basic level.
- There is a React frontend in `apps/web`.
- There is a Hono API in `apps/api`.
- There is a PostgreSQL setup for local development in `infra/db`.
- Drizzle ORM is configured and a first schema exists.
- Shared cross-package types live in `packages/shared`.

## What Is Already Implemented

- Basic frontend and backend project setup.
- Local PostgreSQL via Docker Compose.
- Drizzle schema for `sources`, `items`, and early feed-building groundwork.
- Simple API endpoints for health, source management, polling, feed rebuilding, and resetting source data in development.
- A minimal frontend flow for submitting, listing, deleting, and toggling sources.
- An early RSS polling MVP vertical slice.
- Reddit polling MVP vertical slice.
- Hacker News polling MVP vertical slice.
- Built-in Hacker News source with active toggle support.
- Polling orchestration grouped by source type with controlled concurrency.
- Structured poll run logging for duration, success/error/skipped counts, and persistence results.
- First conservative Reddit MVP rate-limit handling: log 429-style failures and stop starting further Reddit requests for the current run.
- Basic polled-item persistence as groundwork for later feed-building.
- A simple feed read slice via `GET /api/feed`.

## What Is Not Built Yet

- A robust RSS ingest pipeline with stronger validation, dedupe, and edge-case handling.
- Fully hardened Reddit ingest behavior with stronger validation, normalization, and edge-case handling.
- Hardened Hacker News ingest behavior and clearer source-model constraints beyond the current MVP slice.
- Normalized content pipeline for fetched items.
- Ranking and scoring engine.
- A final product-shaped feed endpoint such as `GET /feed/today`.
- Interests management.
- Likes, bookmarks, and feedback loop.
- Auth, multi-user concerns, and deployment pipeline.
- Proper test setup.

## Current Maturity

- The repository is still in early MVP / foundation stage.
- Existing code proves out stack and direction more than final architecture.
- Some code is intentionally rough and should not be overinterpreted as settled design.
- The user learns best by trying out rough ideas and polishing them later.
- Current priority is functional vertical slices first, then polish and hardening.
- Agents should avoid treating current structure as untouchable architecture.
- At the same time, agents should avoid proposing premature abstractions.

## How To Support The User

- Assume the user wants to write at least 90% of the code themselves.
- Default to helping them think, not doing the work for them.
- Explain the approach before suggesting code.
- Prefer tradeoffs, pitfalls, and sequencing over full implementations.
- If code is useful, keep it minimal, local, and educational.
- Review ideas critically instead of agreeing too quickly.
- Point out overengineering when a simpler path fits the current stage better.
- Highlight rabbit holes so the user can decide whether to go deeper.

## What Agents Should Usually Do

- Gather relevant repo context before answering deeper questions.
- Connect advice to the current project stage.
- Use existing code and docs to ground suggestions.
- Suggest incremental next steps rather than complete systems.
- When asked architecture questions, frame options with tradeoffs.
- When asked for debugging help, help isolate likely causes first.
- When asked for code review, focus on correctness, best-practices, clarity, and learning value.

## What Agents Should Avoid

- Do not implement large features by default.
- Do not silently patch the codebase just because tools allow it.
- Do not optimize for fastest delivery if that reduces learning value.
- Do not introduce generic abstractions for hypothetical future needs.
- Do not assume production-hardening is the current priority.
- Do not rewrite working code just to make it cleaner.
- Do not overwhelm the user with enterprise patterns that the project does not need yet.

## Preferred Collaboration Style

- Be a thoughtful technical sparring partner.
- Be honest when an idea is weak or premature.
- Be concrete: mention files, modules, or boundaries when relevant.
- Keep explanations practical and calibrated to an intermediate developer.
- Skip absolute basics unless they matter for the decision.
- If something is a deep rabbit hole, say so.
- Prefer helping the user make a good decision over giving the most sophisticated answer.

## How To Use `docs/plan.md`

- `docs/plan.md` is the deeper source for product vision, roadmap, architecture direction, and design direction.
- Read `docs/plan.md` when the question is about priorities, roadmap, feature scope, ranking logic, UX direction, or product intent.
- Use `AGENTS.md` as the quick briefing.
- Use `docs/plan.md` as the deeper product reference.
- If there is tension between existing rough code and the intended product direction, use `docs/plan.md` to interpret the likely intent.

## Current Focus Areas Inferred From The Repo

- Establishing the core stack and development workflow.
- Building out source management as an early vertical slice.
- Completing the ingest vertical slice across RSS, Reddit, and Hacker News before polishing edge cases.
- Hardening polling orchestration, logging, and conservative rate-limit behavior after the first ingest slices landed.
- Preparing groundwork for normalization, dedupe, and ranking after the source fetchers work end-to-end.
- Keeping the system simple enough to learn from while still feeling like a real product.

## Repo Landmarks

- `apps/web` - React frontend.
- `apps/api` - Hono API and DB-facing backend code.
- `packages/shared` - shared types used across frontend and backend.
- `infra/db` - local PostgreSQL Docker Compose setup.
- `docs/plan.md` - product vision, MVP scope, architecture notes, and roadmap.

## Verified Commands

### Root

- Start local Postgres: `pnpm db:start`
- Stop local Postgres: `pnpm db:stop`

### Frontend (`apps/web`)

- Dev server: `pnpm --dir apps/web dev`
- Build: `pnpm --dir apps/web build`
- Lint: `pnpm --dir apps/web lint`
- Preview production build: `pnpm --dir apps/web preview`
- Type-check only: `pnpm --dir apps/web exec tsc -b`

### Backend (`apps/api`)

- Dev server with watch mode: `pnpm --dir apps/api dev`
- Generate Drizzle migration files: `pnpm --dir apps/api db:generate`
- Apply Drizzle migrations: `pnpm --dir apps/api db:migrate`
- Type-check only: `pnpm --dir apps/api exec tsc --noEmit`

## Test Status

- There is currently no test framework configured in this repo.
- No workspace package defines a `test` script.
- No single-test command exists yet.
- If discussing testing, frame recommendations as future setup advice, not existing workflow.

## Practical Codebase Notes

- Frontend uses React 19, TypeScript, and Vite.
- Backend uses Hono, Node, TypeScript, and Drizzle.
- Backend env loading relies on `dotenv/config`.
- Vite dev server proxies `/api` to the backend.
- Shared types are imported from `@currit/shared/types/...`.
- The current code style is simple and direct rather than heavily abstracted.

## Rule Files Present

- Repo-local `AGENTS.md`: this file.
- Cursor rules: none found in `.cursor/rules/`.
- `.cursorrules`: none found.
- Copilot instructions: none found in `.github/copilot-instructions.md`.
- Do not claim additional repo-specific editor rules exist.

## Good Agent Responses In This Repo

- "Here are the two simplest ways to model this, and why I would start with the first one."
- "Given the current MVP stage, I would avoid introducing a queue here yet."
- "Your current code already has the right seam in `apps/api/src/lib`; I would extend that rather than adding a new service layer."
- "I think this is a rabbit hole unless you first decide how much scoring should be configurable."
- "You probably do not need a generic abstraction yet; a specific helper is enough for the current slice."

## Bad Agent Responses In This Repo

- Large unsolicited implementations.
- Refactors done mainly for elegance.
- Advice that ignores the repo's current maturity.
- Production-scale architecture suggestions without a present need.
- Pretending tests, pipelines, or rules exist when they do not.
