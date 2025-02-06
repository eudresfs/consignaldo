/*
  Warnings:

  - Added the required column `empresaId` to the `Averbacao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `produtoId` to the `Averbacao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `situacaoId` to the `Averbacao` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AverbacaoStatus" AS ENUM ('AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO', 'CANCELADO', 'LIQUIDADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "TipoEmpresa" AS ENUM ('CONSIGNATARIA', 'CONSIGNANTE', 'AGENTE');

-- AlterTable
ALTER TABLE "Averbacao" ADD COLUMN     "empresaId" INTEGER NOT NULL,
ADD COLUMN     "produtoId" INTEGER NOT NULL,
ADD COLUMN     "saldoDevedor" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "situacaoId" INTEGER NOT NULL,
ADD COLUMN     "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "funcionarioId" INTEGER NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcessoVideo" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcessoVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AprovacaoFluxo" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "situacao" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AprovacaoFluxo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AprovacaoNivel" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AprovacaoNivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assunto" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazo" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssuntoResponsavel" (
    "id" SERIAL NOT NULL,
    "assuntoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssuntoResponsavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "ip" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "tabela" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "dados" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoAjuste" (
    "id" SERIAL NOT NULL,
    "averbacaoId" INTEGER NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "situacao" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoAjuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoAjusteTipo" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoAjusteTipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoAjusteDetalhe" (
    "id" SERIAL NOT NULL,
    "ajusteId" INTEGER NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoAjusteDetalhe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoAjusteArquivo" (
    "id" SERIAL NOT NULL,
    "ajusteId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "dados" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoAjusteArquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoHistorico" (
    "id" SERIAL NOT NULL,
    "averbacaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "situacao" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoImportacao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "arquivo" TEXT NOT NULL,
    "situacao" INTEGER NOT NULL,
    "log" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoImportacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoParcela" (
    "id" SERIAL NOT NULL,
    "averbacaoId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "competencia" TEXT NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "situacao" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoParcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoParcelaSituacao" (
    "id" SERIAL NOT NULL,
    "parcelaId" INTEGER NOT NULL,
    "situacao" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoParcelaSituacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoSituacao" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoSituacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoTipo" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "prazo" INTEGER NOT NULL,
    "valorMinimo" DOUBLE PRECISION NOT NULL,
    "valorMaximo" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoTipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoTipoQuitacao" (
    "id" SERIAL NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "tipoQuitacaoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoTipoQuitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoTramitacao" (
    "id" SERIAL NOT NULL,
    "averbacaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "situacao" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoTramitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AverbacaoVinculo" (
    "id" SERIAL NOT NULL,
    "averbacaoId" INTEGER NOT NULL,
    "averbacaoPaiId" INTEGER NOT NULL,
    "tipo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AverbacaoVinculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_matricula_key" ON "Funcionario"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_email_key" ON "Funcionario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_funcionarioId_key" ON "Usuario"("funcionarioId");

-- AddForeignKey
ALTER TABLE "Averbacao" ADD CONSTRAINT "Averbacao_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Averbacao" ADD CONSTRAINT "Averbacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Averbacao" ADD CONSTRAINT "Averbacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Averbacao" ADD CONSTRAINT "Averbacao_situacaoId_fkey" FOREIGN KEY ("situacaoId") REFERENCES "AverbacaoSituacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssuntoResponsavel" ADD CONSTRAINT "AssuntoResponsavel_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AverbacaoAjuste" ADD CONSTRAINT "AverbacaoAjuste_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "AverbacaoAjusteTipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AverbacaoAjusteDetalhe" ADD CONSTRAINT "AverbacaoAjusteDetalhe_ajusteId_fkey" FOREIGN KEY ("ajusteId") REFERENCES "AverbacaoAjuste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AverbacaoAjusteArquivo" ADD CONSTRAINT "AverbacaoAjusteArquivo_ajusteId_fkey" FOREIGN KEY ("ajusteId") REFERENCES "AverbacaoAjuste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AverbacaoParcelaSituacao" ADD CONSTRAINT "AverbacaoParcelaSituacao_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES "AverbacaoParcela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
