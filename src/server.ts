import Fastify, { type FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { TodoRepository } from './repositories/todo-repository.js';
import { HackerNewsClient } from './clients/hackernews-client.js';
import { TodoSyncWithHackerNews } from './services/todo-sync-with-hackernews.js';
import { todosRoutes } from './routes/todos.routes.js';
import { TodoNotFoundError } from './routes/todo-not-found-error.js';

export type ServerDeps = {
  prisma: PrismaClient;
  hnBaseUrl: string;
};

export async function buildServer(deps: ServerDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  const repository = new TodoRepository(deps.prisma);
  const hnClient = new HackerNewsClient(deps.hnBaseUrl);
  const sync = new TodoSyncWithHackerNews(hnClient, repository);

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof TodoNotFoundError) {
      reply.code(404).send({ error: 'Not Found', message: error.message });
      return;
    }
    reply.send(error);
  });

  const fastifyStatic = (await import('@fastify/static')).default;
  const { fileURLToPath } = await import('node:url');
  const pathMod = await import('node:path');
  const publicDir = pathMod.resolve(
    pathMod.dirname(fileURLToPath(import.meta.url)),
    '..',
    'public',
  );
  await app.register(fastifyStatic, { root: publicDir, prefix: '/' });

  await app.register(todosRoutes({ repository, sync }));

  return app;
}
