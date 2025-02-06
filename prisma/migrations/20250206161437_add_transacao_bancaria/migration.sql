/*
  Warnings:

  - You are about to drop the column `logo` on the `Consignataria` table. All the data in the column will be lost.
  - You are about to drop the column `acao` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedBy` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedByName` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedByType` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedOn` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioSerializado` on the `UsuarioHistorico` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigo]` on the table `Consignataria` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj]` on the table `Consignataria` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cnpj` to the `Consignataria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigo` to the `Consignataria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descricao` to the `UsuarioHistorico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `UsuarioHistorico` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Vinculo_consignanteId_consignatariaId_key";

-- AlterTable
ALTER TABLE "Consignataria" DROP COLUMN "logo",
ADD COLUMN     "cnpj" VARCHAR(14) NOT NULL,
ADD COLUMN     "codigo" VARCHAR(20) NOT NULL,
ADD COLUMN     "email" VARCHAR(100),
ADD COLUMN     "telefone" VARCHAR(20),
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "UsuarioHistorico" DROP COLUMN "acao",
DROP COLUMN "ativo",
DROP COLUMN "modifiedBy",
DROP COLUMN "modifiedByName",
DROP COLUMN "modifiedByType",
DROP COLUMN "modifiedOn",
DROP COLUMN "updatedAt",
DROP COLUMN "usuarioSerializado",
ADD COLUMN     "descricao" TEXT NOT NULL,
ADD COLUMN     "tipo" VARCHAR(50) NOT NULL;

-- CreateTable
CREATE TABLE "Servidor" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "matricula" VARCHAR(20) NOT NULL,
    "cargo" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "servidorId" INTEGER NOT NULL,
    "consignatariaId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 3,
    "valorParcela" DECIMAL(10,2) NOT NULL,
    "numeroParcelas" INTEGER NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DescontoContrato" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "competencia" VARCHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DescontoContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollImport" (
    "id" SERIAL NOT NULL,
    "competencia" VARCHAR(7) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollReconciliation" (
    "id" SERIAL NOT NULL,
    "payrollImportId" INTEGER NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "diferenca" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutroDesconto" (
    "id" SERIAL NOT NULL,
    "servidorId" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "competencia" VARCHAR(7) NOT NULL,
    "descricao" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutroDesconto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" SERIAL NOT NULL,
    "integrationConfigId" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" SERIAL NOT NULL,
    "jobName" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Margem" (
    "id" SERIAL NOT NULL,
    "servidorId" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Margem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransacaoBancaria" (
    "id" TEXT NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "bancoId" INTEGER NOT NULL,
    "identificadorTransacao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dataConciliacao" TIMESTAMP(3),
    "divergencias" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransacaoBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Servidor_matricula_key" ON "Servidor"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "TransacaoBancaria_identificadorTransacao_key" ON "TransacaoBancaria"("identificadorTransacao");

-- CreateIndex
CREATE INDEX "TransacaoBancaria_contratoId_idx" ON "TransacaoBancaria"("contratoId");

-- CreateIndex
CREATE INDEX "TransacaoBancaria_bancoId_idx" ON "TransacaoBancaria"("bancoId");

-- CreateIndex
CREATE INDEX "TransacaoBancaria_status_idx" ON "TransacaoBancaria"("status");

-- CreateIndex
CREATE INDEX "TransacaoBancaria_dataPagamento_idx" ON "TransacaoBancaria"("dataPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "Consignataria_codigo_key" ON "Consignataria"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Consignataria_cnpj_key" ON "Consignataria"("cnpj");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_servidorId_fkey" FOREIGN KEY ("servidorId") REFERENCES "Servidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_consignatariaId_fkey" FOREIGN KEY ("consignatariaId") REFERENCES "Consignataria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcela" ADD CONSTRAINT "Parcela_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescontoContrato" ADD CONSTRAINT "DescontoContrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutroDesconto" ADD CONSTRAINT "OutroDesconto_servidorId_fkey" FOREIGN KEY ("servidorId") REFERENCES "Servidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationConfigId_fkey" FOREIGN KEY ("integrationConfigId") REFERENCES "IntegrationConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Margem" ADD CONSTRAINT "Margem_servidorId_fkey" FOREIGN KEY ("servidorId") REFERENCES "Servidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoBancaria" ADD CONSTRAINT "TransacaoBancaria_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoBancaria" ADD CONSTRAINT "TransacaoBancaria_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Consignataria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
