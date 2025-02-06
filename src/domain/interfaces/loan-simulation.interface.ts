export interface LoanSimulation {
  id: string;
  servidorId: number;
  consignatariaId: number;
  valorSolicitado: number;
  prazo: number;
  taxaJuros: number;
  valorParcela: number;
  valorTotal: number;
  cet: number; // Custo Efetivo Total
  iof: number;
  tarifas: LoanFee[];
  parcelas: LoanInstallment[];
  createdAt: Date;
}

export interface LoanFee {
  descricao: string;
  valor: number;
}

export interface LoanInstallment {
  numero: number;
  vencimento: Date;
  valorParcela: number;
  amortizacao: number;
  juros: number;
  saldoDevedor: number;
}

export interface LoanProduct {
  id: number;
  consignatariaId: number;
  nome: string;
  prazoMinimo: number;
  prazoMaximo: number;
  valorMinimo: number;
  valorMaximo: number;
  taxaJuros: number;
  taxaIof: number;
  tarifas: LoanFee[];
  active: boolean;
}

export interface RefinanceSimulation extends LoanSimulation {
  contratoId: string;
  saldoDevedor: number;
  valorLiquidacao: number;
  valorDisponivel: number;
  economiaTotal: number;
}

export interface PortabilitySimulation extends LoanSimulation {
  contratoOrigemId: string;
  bancoOrigemId: number;
  saldoDevedor: number;
  valorPresenteParcelas: number;
  economiaTotal: number;
}
