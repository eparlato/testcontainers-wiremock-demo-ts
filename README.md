# testcontainers-wiremock-demo (TypeScript)

TypeScript / Node 20 port of the [Java Testcontainers + WireMock demo](../testcontainers-wiremock-demo). Used in a workshop on refactoring legacy tests — the code intentionally carries the same anti-patterns as the Java version so students can rehearse the same refactorings against an idiomatic-Node baseline.

## Prerequisites

- Node 20 LTS (see `.nvmrc`)
- Docker or a compatible runtime (Colima, Rancher Desktop, Podman with Docker compat)

## Running

```bash
npm install
npm run dev
```

Starts Postgres and WireMock containers, runs migrations, seeds two sample todos, and launches the API on `http://localhost:8080`. Open `http://localhost:8080/index.html?http://localhost:8080/todos` in a browser.

## Testing

```bash
npm test         # Vitest (unit + integration)
npm run test:e2e # Playwright (UI flow)
npm run test:all # both, sequentially
```

Tests require Docker. Each integration test file spins up its own containers — this is intentional and mirrors the duplication smell present in the Java workshop fixture.

## Intentional smells

This codebase is the "before" state for a refactoring workshop. Expect:

- A repository wrapper around the ORM with mixed responsibilities.
- A distinct persistence type (`TodoEntity`) leaking into one test file.
- Fire-and-forget async on `POST /todos/hn` that forces tests to poll.
- Three test files declaring their own containers inline; one file uses a shared helper.
- Hardcoded title strings in the e2e UI test.
- Scattered `// TODO` comments left as conversation starters.
