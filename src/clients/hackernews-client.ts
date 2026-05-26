import { request } from 'undici';
import type { HackernewsItem } from './hackernews-item.js';

export class HackerNewsClient {
  constructor(private readonly baseUrl: string) {}

  async fetchTopStoryIds(n: number): Promise<number[]> {
    const res = await request(`${this.baseUrl}beststories.json`);
    const ids = (await res.body.json()) as number[];
    return ids.slice(0, n);
  }

  async fetchItem(id: number): Promise<HackernewsItem> {
    const res = await request(`${this.baseUrl}item/${id}.json`);
    return (await res.body.json()) as HackernewsItem;
  }
}
