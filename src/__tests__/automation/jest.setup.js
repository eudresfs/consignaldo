"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const test_database_1 = require("./test-database");
const prisma = new client_1.PrismaClient();
beforeAll(async () => {
    // Configura banco de teste
    const testDb = new test_database_1.TestDatabase();
    await testDb.setup();
    // Executa migrations
    (0, child_process_1.execSync)('npx prisma migrate deploy', {
        env: {
            ...process.env,
            DATABASE_URL: process.env.TEST_DATABASE_URL,
        },
    });
    // Limpa dados
    const tablenames = await prisma.$queryRaw `SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    for (const { tablename } of tablenames) {
        if (tablename !== '_prisma_migrations') {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
            }
            catch (error) {
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
