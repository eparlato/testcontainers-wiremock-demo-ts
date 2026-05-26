import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import path from 'node:path';

export type TestContainers = {
  postgres: StartedPostgreSqlContainer;
  wiremock: StartedTestContainer;
  databaseUrl: string;
  hackernewsBaseUrl: string;
  stop: () => Promise<void>;
};

export async function startTestContainers(): Promise<TestContainers> {
  const postgres = await new PostgreSqlContainer('postgres:15-alpine').start();
  const wiremock = await new GenericContainer('wiremock/wiremock:3.1.0')
    .withCopyFilesToContainer([
      {
        source: path.resolve('tests/fixtures/hackernews-stubs.json'),
        target: '/home/wiremock/mappings/hackernews.json',
      },
    ])
    .withExposedPorts(8080)
    .start();

  return {
    postgres,
    wiremock,
    databaseUrl: postgres.getConnectionUri(),
    hackernewsBaseUrl: `http://${wiremock.getHost()}:${wiremock.getMappedPort(8080)}/`,
    async stop() {
      await Promise.all([postgres.stop(), wiremock.stop()]);
    },
  };
}
