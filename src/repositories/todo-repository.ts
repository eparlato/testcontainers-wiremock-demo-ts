import type { PrismaClient } from '@prisma/client';
import type { Todo } from '../domain/todo.js';
import type { HackernewsItem } from '../clients/hackernews-item.js';

type TodoEntityRow = {
  id: string;
  title: string;
  link: string | null;
  completed: boolean | null;
  order: number | null;
};

function toTodo(row: TodoEntityRow): Todo {
  return {
    id: row.id,
    title: row.title,
    link: row.link,
    completed: row.completed,
    order: row.order,
  };
}

export class TodoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Todo[]> {
    const rows = await this.prisma.todoEntity.findMany();
    return rows.map(toTodo);
  }

  async findById(id: string): Promise<Todo | null> {
    const row = await this.prisma.todoEntity.findUnique({ where: { id } });
    return row ? toTodo(row) : null;
  }

  async save(todo: Todo): Promise<Todo> {
    if (todo.id) {
      const row = await this.prisma.todoEntity.upsert({
        where: { id: todo.id },
        update: {
          title: todo.title,
          link: todo.link,
          completed: todo.completed ?? false,
          order: todo.order,
        },
        create: {
          id: todo.id,
          title: todo.title,
          link: todo.link,
          completed: todo.completed ?? false,
          order: todo.order,
        },
      });
      return toTodo(row);
    }
    const row = await this.prisma.todoEntity.create({
      data: {
        title: todo.title,
        link: todo.link,
        completed: todo.completed ?? false,
        order: todo.order,
      },
    });
    return toTodo(row);
  }

  async delete(todo: Todo): Promise<void> {
    if (!todo.id) return;
    await this.prisma.todoEntity.delete({ where: { id: todo.id } });
  }

  async deleteAll(): Promise<void> {
    await this.prisma.todoEntity.deleteMany({});
  }

  async saveAll(todos: Todo[]): Promise<void> {
    for (const todo of todos) {
      await this.save(todo);
    }
  }

  async getPendingTodos(): Promise<Todo[]> {
    const rows = await this.prisma.todoEntity.findMany({ where: { completed: false } });
    return rows.map(toTodo);
  }

  async saveHackerNewsItem(hnItem: HackernewsItem): Promise<void> {
    const existing = await this.prisma.todoEntity.findMany({ where: { title: hnItem.title } });
    if (existing.length === 0) {
      await this.prisma.todoEntity.create({
        data: {
          title: hnItem.title,
          link: hnItem.url,
          completed: false,
          order: hnItem.descendants,
        },
      });
    }
  }
}
