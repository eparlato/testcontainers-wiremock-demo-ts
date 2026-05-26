import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import type { FastifyInstance } from 'fastify';
import { TodoRepository } from '../../src/repositories/todo-repository.js';
import { buildServer } from '../../src/server.js';

describe('TodoController (integration)', () => {
  let postgres: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let repository: TodoRepository;
  let app: FastifyInstance;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:15-alpine').start();
    const databaseUrl = postgres.getConnectionUri();
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    repository = new TodoRepository(prisma);
    app = await buildServer({ prisma, hnBaseUrl: 'http://unused.example/' });
    await app.ready();
  }, 90_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    await postgres?.stop();
  });

  beforeEach(async () => {
    await repository.deleteAll();
  });

  test('shouldGetAllTodos', async () => {
    await repository.saveAll([
      { id: null, title: 'Todo Item 1', link: 'aLink', completed: false, order: 1 },
      { id: null, title: 'Todo Item 2', link: 'aLink', completed: false, order: 2 },
    ]);

    const res = await request(app.server).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('shouldGetTodoById', async () => {
    const saved = await repository.save({
      id: null, title: 'Todo Item 1', link: 'aProperLink', completed: false, order: 1,
    });

    const res = await request(app.server).get(`/todos/${saved.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Todo Item 1');
    expect(res.body.completed).toBe(false);
    expect(res.body.link).toBe('aProperLink');
    expect(res.body.order).toBe(1);
  });

  test('shouldCreateTodoSuccessfully', async () => {
    const res = await request(app.server)
      .post('/todos')
      .set('content-type', 'application/json')
      .send({ title: 'Todo Item 1', completed: false, order: 1 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Todo Item 1');
    expect(res.body.completed).toBe(false);
    expect(res.body.order).toBe(1);
  });

  test('shouldDeleteTodoById', async () => {
    const saved = await repository.save({
      id: null, title: 'Todo Item 1', link: 'aLink', completed: false, order: 1,
    });

    expect(await repository.findById(saved.id!)).not.toBeNull();

    const res = await request(app.server).delete(`/todos/${saved.id}`);
    expect(res.status).toBe(200);

    expect(await repository.findById(saved.id!)).toBeNull();
  });

  // TODO do we need to test /hn route in this test class?
});
