export type AppConfig = {
  databaseUrl: string;
  hackernewsBaseUrl: string;
  port: number;
};

export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL env var is required');
  }
  return {
    databaseUrl,
    hackernewsBaseUrl: process.env.HACKERNEWS_BASE_URL ?? 'https://hacker-news.firebaseio.com/v0/',
    port: Number(process.env.PORT ?? 8080),
  };
}
