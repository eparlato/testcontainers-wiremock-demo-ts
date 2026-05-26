import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer } from 'testcontainers';
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Starting Postgres container...');
  const postgres = await new PostgreSqlContainer('postgres:15-alpine').start();
  const databaseUrl = postgres.getConnectionUri();

  console.log('Starting WireMock container...');
  const wiremock = await new GenericContainer('wiremock/wiremock:3.1.0')
    .withCopyFilesToContainer([
      {
        source: path.resolve('tests/fixtures/hackernews-stubs.json'),
        target: '/home/wiremock/mappings/hackernews.json',
      },
    ])
    .withExposedPorts(8080)
    .start();
  const hackernewsBaseUrl = `http://${wiremock.getHost()}:${wiremock.getMappedPort(8080)}/`;

  console.log('Running migrations...');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  console.log('Seeding sample data if empty...');
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const existing = await prisma.todoEntity.count();
  if (existing === 0) {
    await prisma.todoEntity.create({
      data: { title: 'Learn about Testcontainers', link: null, completed: false, order: null },
    });
    await prisma.todoEntity.create({
      data: { title: 'Learn about WireMock', link: null, completed: false, order: null },
    });
  }
  await prisma.$disconnect();

  console.log(`Starting server (Postgres at ${databaseUrl}, HN stub at ${hackernewsBaseUrl})`);
  const server = spawn('tsx', ['watch', 'src/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      HACKERNEWS_BASE_URL: hackernewsBaseUrl,
    },
  });

  const shutdown = async () => {
    server.kill('SIGINT');
    await postgres.stop();
    await wiremock.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
