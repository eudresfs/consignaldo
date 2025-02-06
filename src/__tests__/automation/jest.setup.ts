import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import { TestDatabase } from './test-database';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Configura banco de teste
  const testDb = new TestDatabase();
  await testDb.setup();
  
  // Executa migrations
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
  });

  // Limpa dados
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.log({ error });
      }
    }
  }

  // Configura mocks globais
  jest.setTimeout(10000);
  
  // Desativa logs durante testes
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(async () => {
  await prisma.$disconnect();
});
