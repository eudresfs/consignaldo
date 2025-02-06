import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBancoIntegration } from './banco-integration.interface';
import { BancoBrasilIntegration } from './banco-brasil.integration';

@Injectable()
export class BancoIntegrationFactory {
  private readonly integracoes: Map<number, IBancoIntegration>;

  constructor(
    private readonly logger: Logger,
    private readonly config: ConfigService
  ) {
    this.integracoes = new Map();
    this.inicializarIntegracoes();
  }

  private inicializarIntegracoes() {
    // Inicializa as integrações disponíveis
    this.integracoes.set(1, new BancoBrasilIntegration(this.logger, this.config));
    // Adicionar outras integrações conforme necessário
  }

  /**
   * Obtém a integração para um banco específico
   * @param bancoId ID do banco
   * @returns Interface de integração do banco
   * @throws Error se o banco não tiver integração implementada
   */
  getIntegracao(bancoId: number): IBancoIntegration {
    const integracao = this.integracoes.get(bancoId);
    if (!integracao) {
      throw new Error(`Integração não implementada para o banco ${bancoId}`);
    }
    return integracao;
  }

  /**
   * Verifica se existe integração para um banco
   * @param bancoId ID do banco
   * @returns true se existir integração
   */
  hasIntegracao(bancoId: number): boolean {
    return this.integracoes.has(bancoId);
  }

  /**
   * Lista todos os bancos com integração disponível
   * @returns Lista de IDs dos bancos
   */
  getBancosDisponiveis(): number[] {
    return Array.from(this.integracoes.keys());
  }
}
