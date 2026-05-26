# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Build & Test Commands

This is a Node 20 + TypeScript project. Docker must be running for tests and dev mode (Testcontainers).

- **Type-check:** `npx tsc --noEmit`
- **Run all unit + integration tests:** `npm test`
- **Run a single test file:** `npx vitest run tests/integration/todos.routes.test.ts`
- **Run a single test by name:** `npx vitest run -t shouldGetAllTodos`
- **Run e2e (Playwright):** `npm run test:e2e`
- **Run app in dev mode (with Testcontainers):** `npm run dev`
- **Build:** `npm run build`

## Architecture

Node 20 / TypeScript todo app with HackerNews integration. Demonstrates Testcontainers + WireMock for testing. TS counterpart of the Java/Spring project; preserves the same anti-patterns intentionally for a refactoring workshop.

### Main Application (`src/`)

- **`index.ts`** — entry point; loads config, instantiates Prisma, calls `buildServer`.
- **`server.ts`** — `buildServer({ prisma, hnBaseUrl })`: builds Fastify, wires repository/client/service, registers routes and static files.
- **`config.ts`** — reads `DATABASE_URL`, `HACKERNEWS_BASE_URL`, `PORT`.
- **`domain/todo.ts`** — domain `Todo` type.
- **`routes/todos.routes.ts`** — Fastify plugin for `/todos` CRUD plus `POST /todos/hn`. Contains a `console.log` in PATCH (smell).
- **`routes/todo-not-found-error.ts`** — error class mapped to 404 by `setErrorHandler`.
- **`services/todo-sync-with-hackernews.ts`** — fire-and-forget HN sync.
- **`clients/hackernews-client.ts`** — undici-based HN API client.
- **`clients/hackernews-item.ts`** — `HackernewsItem` type.
- **`repositories/todo-repository.ts`** — wraps `PrismaClient`; mixes business logic (`saveHackerNewsItem`) with data access.

### Database

PostgreSQL via Prisma. Raw SQL migrations in `prisma/migrations/` (mirroring the Java Flyway migrations byte-for-byte). No hardcoded DB config — `DATABASE_URL` is injected by the dev runner (Testcontainers) or by the test setup.

### Test Infrastructure (`tests/`)

- **`tests/integration/todo-repository.test.ts`** — own inline Postgres container; one test (`shouldGetPendingTodos`) plus TODOs.
- **`tests/integration/hackernews-client.test.ts`** — own inline WireMock container; the `shouldFetchItem` body is intentionally empty (matches Java `// TODO complete`).
- **`tests/integration/todos.routes.test.ts`** — own inline Postgres container; CRUD route tests.
- **`tests/integration/application.test.ts`** — uses shared `tests/containers/containers-config.ts`; full HN flow; deserializes into a `TodoEntity`-shaped type (persistence leak smell).
- **`tests/e2e/hackernews-ui.spec.ts`** — Playwright; uses the shared helper; hardcoded title strings.

The duplication between inline container setup (three files) and the shared helper (two files) is intentional — it's one of the workshop targets.

### Fixtures

- **`tests/fixtures/hackernews-stubs.json`** — WireMock stub mappings, copied verbatim from the Java project.
