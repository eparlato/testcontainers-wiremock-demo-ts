import { afterAll, beforeAll, describe, test, expect } from 'vitest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import path from 'node:path';
import { HackerNewsClient } from '../../src/clients/hackernews-client.js';

describe('HackerNewsClient (integration)', () => {
  let wiremock: StartedTestContainer;
  let baseUrl: string;

  beforeAll(async () => {
    wiremock = await new GenericContainer('wiremock/wiremock:3.1.0')
      .withCopyFilesToContainer([
        {
          source: path.resolve('tests/fixtures/hackernews-stubs.json'),
          target: '/home/wiremock/mappings/hackernews.json',
        },
      ])
      .withExposedPorts(8080)
      .start();
    baseUrl = `http://${wiremock.getHost()}:${wiremock.getMappedPort(8080)}/`;
  }, 90_000);

  afterAll(async () => {
    await wiremock?.stop();
  });

  test('shouldFetchItem', async () => {
    const client = new HackerNewsClient(baseUrl);

    const item = await client.fetchItem(12345);

    expect(item).toBeDefined();
    expect(item).toMatchObject({
      // TODO complete
    });
  });

  // TODO should fetch top stories id
  // TODO error scenarios to be tested: 500, 404, empty list, malformed JSON
});
