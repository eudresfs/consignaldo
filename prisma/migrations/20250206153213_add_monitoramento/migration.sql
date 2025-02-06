-- CreateEnum
CREATE TYPE "TipoMetrica" AS ENUM ('CONTADOR', 'MEDIDOR', 'HISTOGRAMA', 'RESUMO');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('THRESHOLD', 'ANOMALIA', 'TENDENCIA');

-- CreateEnum
CREATE TYPE "SeveridadeAlerta" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('ATIVO', 'RESOLVIDO', 'IGNORADO', 'EM_ANALISE');

-- CreateTable
CREATE TABLE "metricas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoMetrica" NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "unidade" TEXT,
    "valor" DOUBLE PRECISION,
    "valores" DOUBLE PRECISION[],
    "buckets" DOUBLE PRECISION[],
    "contagens" INTEGER[],
    "percentis" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metricas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_alerta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "metricaId" TEXT NOT NULL,
    "severidade" "SeveridadeAlerta" NOT NULL,
    "condicao" TEXT NOT NULL,
    "intervalo" INTEGER NOT NULL,
    "notificar" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "regraId" TEXT NOT NULL,
    "status" "StatusAlerta" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "mensagem" TEXT NOT NULL,
    "detalhes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "resolvidoEm" TIMESTAMP(3),

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "paineis" JSONB NOT NULL DEFAULT '[]',
    "compartilhadoCom" TEXT[],
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "contexto" JSONB NOT NULL DEFAULT '{}',
    "origem" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "trace" TEXT,
    "usuario" TEXT,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traces" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER NOT NULL,
    "servico" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "spans" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "traces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metricas_nome_idx" ON "metricas"("nome");
CREATE INDEX "metricas_tipo_idx" ON "metricas"("tipo");
CREATE INDEX "metricas_criadoEm_idx" ON "metricas"("criadoEm");

-- CreateIndex
CREATE INDEX "regras_alerta_metricaId_idx" ON "regras_alerta"("metricaId");
CREATE INDEX "regras_alerta_tipo_idx" ON "regras_alerta"("tipo");
CREATE INDEX "regras_alerta_severidade_idx" ON "regras_alerta"("severidade");

-- CreateIndex
CREATE INDEX "alertas_regraId_idx" ON "alertas"("regraId");
CREATE INDEX "alertas_status_idx" ON "alertas"("status");
CREATE INDEX "alertas_criadoEm_idx" ON "alertas"("criadoEm");

-- CreateIndex
CREATE INDEX "logs_nivel_idx" ON "logs"("nivel");
CREATE INDEX "logs_origem_idx" ON "logs"("origem");
CREATE INDEX "logs_timestamp_idx" ON "logs"("timestamp");
CREATE INDEX "logs_trace_idx" ON "logs"("trace");

-- CreateIndex
CREATE INDEX "traces_servico_idx" ON "traces"("servico");
CREATE INDEX "traces_operacao_idx" ON "traces"("operacao");
CREATE INDEX "traces_inicio_idx" ON "traces"("inicio");
CREATE INDEX "traces_status_idx" ON "traces"("status");

-- AddForeignKey
ALTER TABLE "regras_alerta" ADD CONSTRAINT "regras_alerta_metricaId_fkey" FOREIGN KEY ("metricaId") REFERENCES "metricas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "regras_alerta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
