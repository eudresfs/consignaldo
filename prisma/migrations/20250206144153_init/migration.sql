-- CreateTable
CREATE TABLE "Consignataria" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "logo" VARCHAR(50),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consignataria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consignante" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "logo" VARCHAR(50),
    "bancoDados" VARCHAR(50),
    "url" VARCHAR(150),
    "tipo" VARCHAR(1),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consignante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vinculo" (
    "id" SERIAL NOT NULL,
    "consignatariaId" INTEGER NOT NULL,
    "consignanteId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioVinculo" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "vinculoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioVinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioHistorico" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "usuarioSerializado" TEXT,
    "modifiedOn" TIMESTAMP(3) NOT NULL,
    "modifiedBy" INTEGER,
    "modifiedByName" VARCHAR(300),
    "modifiedByType" VARCHAR(1),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "acao" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UsuarioConsignataria" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Vinculo_consignanteId_consignatariaId_key" ON "Vinculo"("consignanteId", "consignatariaId");

-- CreateIndex
CREATE UNIQUE INDEX "_UsuarioConsignataria_AB_unique" ON "_UsuarioConsignataria"("A", "B");

-- CreateIndex
CREATE INDEX "_UsuarioConsignataria_B_index" ON "_UsuarioConsignataria"("B");

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_consignatariaId_fkey" FOREIGN KEY ("consignatariaId") REFERENCES "Consignataria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_consignanteId_fkey" FOREIGN KEY ("consignanteId") REFERENCES "Consignante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioVinculo" ADD CONSTRAINT "UsuarioVinculo_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "Vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioVinculo" ADD CONSTRAINT "UsuarioVinculo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioHistorico" ADD CONSTRAINT "UsuarioHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioConsignataria" ADD CONSTRAINT "_UsuarioConsignataria_A_fkey" FOREIGN KEY ("A") REFERENCES "Consignataria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioConsignataria" ADD CONSTRAINT "_UsuarioConsignataria_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
