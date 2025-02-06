-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'WEBHOOK');
CREATE TYPE "PrioridadeNotificacao" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
CREATE TYPE "StatusNotificacao" AS ENUM ('PENDENTE', 'ENVIANDO', 'ENVIADO', 'ERRO', 'CANCELADO');
CREATE TYPE "StatusTemplate" AS ENUM ('ATIVO', 'INATIVO', 'RASCUNHO');

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "prioridade" "PrioridadeNotificacao" NOT NULL,
    "status" "StatusNotificacao" NOT NULL DEFAULT 'PENDENTE',
    "destinatario" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "template_id" TEXT,
    "dados" JSONB,
    "agendado_para" TIMESTAMP(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultima_tentativa" TIMESTAMP(3),
    "erro" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "enviado_em" TIMESTAMP(3),

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates_notificacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoNotificacao" NOT NULL,
    "status" "StatusTemplate" NOT NULL DEFAULT 'RASCUNHO',
    "assunto" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "html" TEXT,
    "variaveis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "eventos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "headers" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "secret_key" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "ultimo_envio" TIMESTAMP(3),
    "ultimo_status" INTEGER,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos_notificacao" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "destinatario" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "dados" JSONB,
    "expressao_cron" TEXT NOT NULL,
    "ultima_execucao" TIMESTAMP(3),
    "proxima_execucao" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_notificacao" (
    "id" TEXT NOT NULL,
    "notificacao_id" TEXT NOT NULL,
    "status" "StatusNotificacao" NOT NULL,
    "tentativa" INTEGER NOT NULL,
    "erro" TEXT,
    "dados" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_status_idx" ON "notificacoes"("status");
CREATE INDEX "notificacoes_tipo_idx" ON "notificacoes"("tipo");
CREATE INDEX "notificacoes_agendado_para_idx" ON "notificacoes"("agendado_para");
CREATE INDEX "templates_notificacao_nome_idx" ON "templates_notificacao"("nome");
CREATE INDEX "templates_notificacao_tipo_idx" ON "templates_notificacao"("tipo");
CREATE INDEX "webhooks_url_idx" ON "webhooks"("url");
CREATE INDEX "agendamentos_notificacao_template_id_idx" ON "agendamentos_notificacao"("template_id");
CREATE INDEX "historico_notificacao_notificacao_id_idx" ON "historico_notificacao"("notificacao_id");

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates_notificacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos_notificacao" ADD CONSTRAINT "agendamentos_notificacao_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates_notificacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_notificacao" ADD CONSTRAINT "historico_notificacao_notificacao_id_fkey" FOREIGN KEY ("notificacao_id") REFERENCES "notificacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
