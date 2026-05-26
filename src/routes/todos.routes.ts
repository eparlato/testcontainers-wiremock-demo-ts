import type { FastifyPluginAsync } from 'fastify';
import type { TodoRepository } from '../repositories/todo-repository.js';
import type { TodoSyncWithHackerNews } from '../services/todo-sync-with-hackernews.js';
import type { Todo } from '../domain/todo.js';
import { TodoNotFoundError } from './todo-not-found-error.js';

type Deps = {
  repository: TodoRepository;
  sync: TodoSyncWithHackerNews;
};

type TodoBody = Partial<Todo>;

export const todosRoutes = (deps: Deps): FastifyPluginAsync => async (app) => {
  app.get('/todos', async () => deps.repository.findAll());

  app.post('/todos/hn', async (_req, reply) => {
    deps.sync.updateTodoWithHackerNewsTopStories(4);
    reply.code(200).send();
  });

  app.get<{ Params: { id: string } }>('/todos/:id', async (req) => {
    const found = await deps.repository.findById(req.params.id);
    if (!found) throw new TodoNotFoundError(req.params.id);
    return found;
  });

  app.post<{ Body: TodoBody }>('/todos', async (req, reply) => {
    const body = req.body ?? {};
    const incoming: Todo = {
      id: null,
      title: body.title ?? '',
      link: body.link ?? null,
      completed: body.completed ?? false,
      order: body.order ?? null,
    };
    const saved = await deps.repository.save(incoming);
    const locationUrl = `${req.protocol}://${req.hostname}/todos/${saved.id}`;
    reply.header('Location', locationUrl).code(201).send(saved);
  });

  app.patch<{ Params: { id: string }; Body: TodoBody }>('/todos/:id', async (req) => {
    const existing = await deps.repository.findById(req.params.id);
    if (!existing) throw new TodoNotFoundError(req.params.id);
    const body = req.body ?? {};
    const merged: Todo = {
      id: existing.id,
      title: body.title ?? existing.title,
      link: existing.link,
      completed: body.completed ?? existing.completed,
      order: body.order ?? existing.order,
    };
    console.log(`updated from [${JSON.stringify(existing)}] to [${JSON.stringify(merged)}]`);
    return deps.repository.save(merged);
  });

  app.delete<{ Params: { id: string } }>('/todos/:id', async (req, reply) => {
    const existing = await deps.repository.findById(req.params.id);
    if (!existing) throw new TodoNotFoundError(req.params.id);
    await deps.repository.delete(existing);
    reply.code(200).send();
  });

  app.delete('/todos', async (_req, reply) => {
    await deps.repository.deleteAll();
    reply.code(200).send();
  });
};
