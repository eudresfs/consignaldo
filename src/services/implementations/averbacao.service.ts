@Injectable()
export class AverbacaoService implements IAverbacaoService {
  constructor(
    private readonly averbacaoRepository: AverbacaoRepository,
    private readonly funcionarioService: FuncionarioService
  ) {}

  async criarAverbacao(data: CriarAverbacaoDTO): Promise<Averbacao> {
    // Validar margem
    const margem = await this.calcularMargem(data.funcionarioId);
    if (data.valorParcela > margem) {
      throw new MargemInsuficienteException({
        margem,
        valorParcela: data.valorParcela,
        funcionarioId: data.funcionarioId
      });
    }

    // Criar averbação
    return this.averbacaoRepository.create({
      ...data,
      valorTotal: data.valor,
      saldoDevedor: data.valor,
      situacaoId: AverbacaoStatus.AGUARDANDO_APROVACAO,
      data: new Date(),
      ativo: true
    });
  }

  async calcularMargem(funcionarioId: number): Promise<number> {
    const funcionario = await this.funcionarioService.findById(funcionarioId);
    const averbacoesAtivas = await this.averbacaoRepository.findAtivas(funcionarioId);
    
    const margemComprometida = averbacoesAtivas.reduce(
      (total, averbacao) => total + averbacao.valorParcela, 
      0
    );

    return (funcionario.salario * 0.3) - margemComprometida;
  }
} 