import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { TodoRepository } from '../../src/repositories/todo-repository.js';

describe('TodoRepository (integration)', () => {
  let postgres: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let repository: TodoRepository;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:15-alpine').start();
    const databaseUrl = postgres.getConnectionUri();
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    repository = new TodoRepository(prisma);
  }, 90_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await postgres?.stop();
  });

  beforeEach(async () => {
    await repository.deleteAll();
    await repository.save({ id: null, title: 'Todo Item 1', link: 'aLink', completed: true, order: 1 });
    await repository.save({ id: null, title: 'Todo Item 2', link: 'aLink', completed: false, order: 2 });
    await repository.save({ id: null, title: 'Todo Item 3', link: 'aLink', completed: false, order: 3 });
  });

  test('shouldGetPendingTodos', async () => {
    const pending = await repository.getPendingTodos();
    expect(pending).toHaveLength(2);
  });

  // TODO saveHackerNewsItem with item present
  // TODO saveHackerNewsItem with item missing
  // TODO tests for CRUD operations...
});
