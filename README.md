# testcontainers-wiremock-demo (TypeScript)

TypeScript / Node 20 port of the [Java Testcontainers + WireMock demo](https://github.com/eparlato/testcontainers-wiremock-demo). 

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

