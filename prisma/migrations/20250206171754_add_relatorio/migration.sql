-- CreateTable
CREATE TABLE "Relatorio" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "filtros" JSONB,
    "status" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "urlDownload" TEXT,
    "erro" TEXT,
    "metadata" JSONB,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Relatorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relatorio_tipo_idx" ON "Relatorio"("tipo");

-- CreateIndex
CREATE INDEX "Relatorio_status_idx" ON "Relatorio"("status");

-- CreateIndex
CREATE INDEX "Relatorio_dataCriacao_idx" ON "Relatorio"("dataCriacao");

-- CreateIndex
CREATE INDEX "Relatorio_usuarioId_idx" ON "Relatorio"("usuarioId");

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
