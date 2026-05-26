import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server.js';
import { startTestContainers, type TestContainers } from '../containers/containers-config.js';
import { TodoRepository } from '../../src/repositories/todo-repository.js';

// NOTE: this type is deliberately shaped after the persistence model (TodoEntity in Prisma),
// preserving the persistence-type leak smell from the Java version's ApplicationTests.
type TodoEntityShape = {
  id: string;
  title: string;
  link: string | null;
  completed: boolean | null;
  order: number | null;
};

describe('Application (integration)', () => {
  let containers: TestContainers;
  let prisma: PrismaClient;
  let app: FastifyInstance;
  let repository: TodoRepository;

  beforeAll(async () => {
    containers = await startTestContainers();
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: containers.databaseUrl },
      stdio: 'inherit',
    });
    prisma = new PrismaClient({ datasources: { db: { url: containers.databaseUrl } } });
    repository = new TodoRepository(prisma);
    app = await buildServer({ prisma, hnBaseUrl: containers.hackernewsBaseUrl });
    await app.ready();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    await containers?.stop();
  });

  beforeEach(async () => {
    await repository.deleteAll();
  });

  test('getsNewsFromHackerNews', async () => {
    const post = await request(app.server).post('/todos/hn');
    expect(post.status).toBe(200);

    await vi.waitFor(async () => {
      const res = await request(app.server).get('/todos');
      expect(res.status).toBe(200);
      const todos = res.body as TodoEntityShape[];
      console.log(todos);
      expect(todos).toHaveLength(4);
    }, { timeout: 10_000, interval: 250 });
  });

  // TODO test other scenarios
});
