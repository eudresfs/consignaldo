export interface IAverbacaoService {
  criarAverbacao(data: CriarAverbacaoDTO): Promise<Averbacao>;
  calcularMargem(funcionarioId: number): Promise<number>;
  validarAverbacao(data: ValidarAverbacaoDTO): Promise<boolean>;
}

export interface CriarAverbacaoDTO {
  funcionarioId: number;
  empresaId: number;
  produtoId: number;
  valor: number;
  prazo: number;
  valorParcela: number;
} 