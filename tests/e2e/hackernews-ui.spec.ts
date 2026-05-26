import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { buildServer } from '../../src/server.js';
import { startTestContainers, type TestContainers } from '../containers/containers-config.js';
import type { FastifyInstance } from 'fastify';
import type { AddressInfo } from 'node:net';

let containers: TestContainers;
let prisma: PrismaClient;
let app: FastifyInstance;
let baseUrl: string;

test.beforeAll(async () => {
  containers = await startTestContainers();
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: containers.databaseUrl },
    stdio: 'inherit',
  });
  prisma = new PrismaClient({ datasources: { db: { url: containers.databaseUrl } } });
  app = await buildServer({ prisma, hnBaseUrl: containers.hackernewsBaseUrl });
  await app.listen({ host: '127.0.0.1', port: 0 });
  const { port } = app.server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await containers?.stop();
});

test('getsNewsFromHackerNewsThroughUI', async ({ page }) => {
  await page.goto(`${baseUrl}/index.html?${baseUrl}/todos`);

  const hnButton = page.locator('#read-hackernews');
  await hnButton.click();

  await expect(page.locator('#todo-list li')).toHaveCount(4, { timeout: 15_000 });

  const titles = await page.locator('#todo-list li label').allTextContents();

  // Hardcoded titles matching the WireMock stubs — intentional smell, mirrors the Java HackerNewsUITests
  expect(titles).toContain('WireMock has an official Testcontainers module!');
  expect(titles).toContain('WireMock and AtomicJar partnership on Testcontainers');
  expect(titles).toContain('State of Local Development and Testing 2023');
  expect(titles).toContain('Check it out: Testcontainers for C/C++');
});
