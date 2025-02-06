import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export async function createTestServidor(prisma: PrismaService) {
  return prisma.servidor.create({
    data: {
      nome: 'Servidor Teste',
      cpf: '12345678900',
      matricula: '123456',
      orgaoId: 1,
      cargoId: 1,
      dataNascimento: new Date('1980-01-01'),
      email: 'servidor@teste.com',
      telefone: '11999999999',
      salarioBruto: 5000,
      margemConsignavel: 1500,
      ativo: true
    }
  });
}

export async function createTestBanco(prisma: PrismaService, data: { nome: string }) {
  return prisma.banco.create({
    data: {
      nome: data.nome,
      codigo: '999',
      ativo: true
    }
  });
}

export async function createTestContrato(
  prisma: PrismaService,
  data: {
    servidorId: number;
    bancoId: number;
    valorParcela: number;
    taxaJuros: number;
    parcelasPagas: number;
    prazoTotal: number;
  }
) {
  return prisma.contrato.create({
    data: {
      servidorId: data.servidorId,
      bancoId: data.bancoId,
      valorContrato: data.valorParcela * data.prazoTotal,
      valorParcela: data.valorParcela,
      taxaJuros: data.taxaJuros,
      parcelasPagas: data.parcelasPagas,
      parcelasTotal: data.prazoTotal,
      dataInicio: new Date(),
      status: 'ATIVO',
      tipo: 'NOVO'
    }
  });
}
