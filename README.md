# Currit

Currit is a personal curated-feed app for replacing low-value doomscrolling with a smaller, calmer daily reading list.

Instead of an infinite feed, the goal is a limited set of worthwhile items from user-selected sources such as RSS feeds, subreddits, and Hacker News.

## Current status

This repository is an early MVP / learning project.

Currently implemented:

- React frontend in `apps/web`
- Hono API in `apps/api`
- Local PostgreSQL setup in `infra/db`
- Source management for RSS, Reddit, and built-in Hacker News
- Polling MVP slices for RSS, Reddit, and Hacker News
- Basic item persistence and a simple feed read endpoint

Still intentionally unfinished:

- ranking and scoring
- robust normalization and deduplication
- likes, bookmarks, and interests
- production deployment and test setup

## Repository layout

- `apps/web` – frontend
- `apps/api` – backend API
- `packages/shared` – shared types and utilities
- `infra/db` – local PostgreSQL setup
- `docs/plan.md` – product direction and roadmap
- `docs/todo.md` – current implementation checklist

## Run locally

Start the local database:

```bash
pnpm db:start
```

Start frontend and backend together:

```bash
pnpm dev:up
```

Stop the local dev stack:

```bash
pnpm dev:down
```

You can also run the apps separately:

```bash
pnpm server:dev
pnpm frontend:dev
```

## Notes

- This project is currently single-user.
- Hacker News is treated as a built-in source.
- The current MVP prioritizes functional vertical slices over polish.
