import type { HackerNewsClient } from '../clients/hackernews-client.js';
import type { TodoRepository } from '../repositories/todo-repository.js';

export class TodoSyncWithHackerNews {
  constructor(
    private readonly hnClient: HackerNewsClient,
    private readonly repo: TodoRepository,
  ) {}

  updateTodoWithHackerNewsTopStories(n: number): void {
    void (async () => {
      const ids = await this.hnClient.fetchTopStoryIds(n);
      for (const id of ids) {
        const item = await this.hnClient.fetchItem(id);
        await this.repo.saveHackerNewsItem(item);
      }
    })();
  }
}
