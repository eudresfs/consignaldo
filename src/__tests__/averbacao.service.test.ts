import { AverbacaoService } from '../services/averbacao.service';
import { CriarAverbacaoDto } from '../dtos/criar-averbacao.dto';

describe('AverbacaoService', () => {
  let service: AverbacaoService;

  beforeEach(() => {
    service = new AverbacaoService();
  });

  it('deve criar uma averbação com sucesso quando a margem for suficiente', async () => {
    const dto: CriarAverbacaoDto = {
      produtoId: 1,
      consignatariaId: 1,
      funcionarioId: 1,
      averbacaoTipo: 1,
      usuarioId: 1,
      identificador: 'ABC',
      numero: '123',
      valorParcela: 500, // valor abaixo da margem fixa de 1000
      valorDeducaoMargem: 100,
      valorContratado: 10000,
      competenciaInicial: '2023-01',
      competenciaFinal: '2023-12'
    };
    const averbacao = await service.criarAverbacao(dto);
    expect(averbacao).toHaveProperty('id');
    expect(averbacao.valorParcela).toEqual(dto.valorParcela);
    // Status inicial deve ser Aguardando (valor 3)
    expect(averbacao.situacao).toEqual(3);
  });

  it('deve lançar erro quando o valor da parcela ultrapassar a margem disponível', async () => {
    const dto: CriarAverbacaoDto = {
      produtoId: 1,
      consignatariaId: 1,
      funcionarioId: 1,
      averbacaoTipo: 1,
      usuarioId: 1,
      identificador: 'XYZ',
      numero: '456',
      valorParcela: 1500, // valor acima da margem fixa de 1000
      valorDeducaoMargem: 200,
      valorContratado: 15000,
      competenciaInicial: '2023-01',
      competenciaFinal: '2023-12'
    };
    await expect(service.criarAverbacao(dto))
      .rejects
      .toThrow(/Margem insuficiente/);
  });
}); 