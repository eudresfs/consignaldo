"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const prisma = new client_1.PrismaClient();
beforeAll(async () => {
    // Configura ambiente de teste
    process.env.NODE_ENV = 'test';
    // Executa migrations
    (0, child_process_1.execSync)('npx prisma migrate reset --force', {
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
});
afterAll(async () => {
    await prisma.$disconnect();
});
