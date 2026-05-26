import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildServer } from './server.js';
import { loadConfig } from './config.js';

async function main() {
  const config = loadConfig();
  const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  const app = await buildServer({ prisma, hnBaseUrl: config.hackernewsBaseUrl });

  const shutdown = async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ host: '0.0.0.0', port: config.port });
  console.log(`Server listening on http://localhost:${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
