import { Test, TestingModule } from '@nestjs/testing';
import { BaseNotificacaoProvider } from './base.provider';
import { TipoNotificacao, StatusNotificacao, PrioridadeNotificacao } from '../../../domain/notificacoes/notificacoes.types';

class TestProvider extends BaseNotificacaoProvider {
  tipo = TipoNotificacao.EMAIL;

  async enviar(): Promise<void> {
    return;
  }

  async validarConfiguracao(): Promise<boolean> {
    return true;
  }

  // Expõe métodos protegidos para teste
  public processarTemplateTest(template: string, dados: Record<string, any>): string {
    return this.processarTemplate(template, dados);
  }

  public registrarSucessoTest(notificacao: any): void {
    return this.registrarSucesso(notificacao);
  }

  public registrarErroTest(notificacao: any, erro: Error): void {
    return this.registrarErro(notificacao, erro);
  }
}

describe('BaseNotificacaoProvider', () => {
  let provider: TestProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestProvider]
    }).compile();

    provider = module.get<TestProvider>(TestProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('processarTemplate', () => {
    it('should replace template variables', () => {
      const template = 'Olá {{nome}}, seu saldo é {{saldo}}';
      const dados = { nome: 'João', saldo: 'R$ 100,00' };

      const resultado = provider.processarTemplateTest(template, dados);

      expect(resultado).toBe('Olá João, seu saldo é R$ 100,00');
    });

    it('should handle missing variables', () => {
      const template = 'Olá {{nome}}, seu saldo é {{saldo}}';
      const dados = { nome: 'João' };

      const resultado = provider.processarTemplateTest(template, dados);

      expect(resultado).toBe('Olá João, seu saldo é {{saldo}}');
    });

    it('should handle empty template', () => {
      const template = '';
      const dados = { nome: 'João' };

      const resultado = provider.processarTemplateTest(template, dados);

      expect(resultado).toBe('');
    });
  });

  describe('registrarSucesso', () => {
    it('should log success', () => {
      const spyLogger = jest.spyOn(provider['logger'], 'log');
      const notificacao = {
        id: '1',
        tipo: TipoNotificacao.EMAIL,
        destinatario: 'teste@teste.com',
        prioridade: PrioridadeNotificacao.MEDIA,
        status: StatusNotificacao.ENVIADO,
        titulo: 'Teste',
        conteudo: 'Conteúdo teste',
        tentativas: 1,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      provider.registrarSucessoTest(notificacao);

      expect(spyLogger).toHaveBeenCalledWith(
        `Notificação ${notificacao.id} enviada com sucesso para ${notificacao.destinatario}`
      );
    });
  });

  describe('registrarErro', () => {
    it('should log error', () => {
      const spyLogger = jest.spyOn(provider['logger'], 'error');
      const notificacao = {
        id: '1',
        tipo: TipoNotificacao.EMAIL,
        destinatario: 'teste@teste.com',
        prioridade: PrioridadeNotificacao.MEDIA,
        status: StatusNotificacao.ERRO,
        titulo: 'Teste',
        conteudo: 'Conteúdo teste',
        tentativas: 1,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };
      const erro = new Error('Erro ao enviar');

      provider.registrarErroTest(notificacao, erro);

      expect(spyLogger).toHaveBeenCalledWith(
        `Erro ao enviar notificação ${notificacao.id} para ${notificacao.destinatario}`,
        erro.stack
      );
    });
  });
});
