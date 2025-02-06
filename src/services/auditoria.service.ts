import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { AuditoriaRepository } from '../repositories/auditoria.repository';
import { 
  TipoAuditoria, 
  TipoOperacao, 
  NivelCriticidade,
  IRegistroAuditoria 
} from '../domain/auditoria/auditoria.types';
import { RegistrarAuditoriaDTO, FiltrarAuditoriaDTO } from '../dtos/auditoria/auditoria.dto';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly auditoriaRepository: AuditoriaRepository) {}

  async registrar(
    dto: RegistrarAuditoriaDTO,
    usuarioId: number,
    request?: Request
  ): Promise<IRegistroAuditoria> {
    try {
      const registro = await this.auditoriaRepository.registrar({
        ...dto,
        usuarioId,
        ip: request?.ip,
        userAgent: request?.headers['user-agent']
      });

      this.logger.log(`Registro de auditoria criado: ${registro.id}`);
      return registro;
    } catch (error) {
      this.logger.error('Erro ao registrar auditoria', error);
      throw error;
    }
  }

  async registrarAutenticacao(
    usuarioId: number,
    sucesso: boolean,
    request?: Request,
    metadata?: any
  ) {
    return this.registrar(
      {
        tipo: TipoAuditoria.AUTENTICACAO,
        operacao: TipoOperacao.PROCESSAR,
        criticidade: NivelCriticidade.ALTO,
        metadata: {
          ...metadata,
          sucesso,
          timestamp: new Date().toISOString()
        }
      },
      usuarioId,
      request
    );
  }

  async registrarOperacaoContrato(
    usuarioId: number,
    operacao: TipoOperacao,
    contratoId: string,
    dadosAnteriores?: any,
    dadosNovos?: any,
    request?: Request
  ) {
    return this.registrar(
      {
        tipo: TipoAuditoria.CONTRATO,
        operacao,
        criticidade: NivelCriticidade.ALTO,
        entidadeId: contratoId,
        entidadeTipo: 'Contrato',
        dadosAnteriores,
        dadosNovos
      },
      usuarioId,
      request
    );
  }

  async registrarOperacaoMargem(
    usuarioId: number,
    operacao: TipoOperacao,
    margemId: string,
    dadosAnteriores?: any,
    dadosNovos?: any,
    request?: Request
  ) {
    return this.registrar(
      {
        tipo: TipoAuditoria.MARGEM,
        operacao,
        criticidade: NivelCriticidade.MEDIO,
        entidadeId: margemId,
        entidadeTipo: 'Margem',
        dadosAnteriores,
        dadosNovos
      },
      usuarioId,
      request
    );
  }

  async registrarOperacaoConciliacao(
    usuarioId: number,
    operacao: TipoOperacao,
    conciliacaoId: string,
    dadosAnteriores?: any,
    dadosNovos?: any,
    request?: Request
  ) {
    return this.registrar(
      {
        tipo: TipoAuditoria.CONCILIACAO,
        operacao,
        criticidade: NivelCriticidade.MEDIO,
        entidadeId: conciliacaoId,
        entidadeTipo: 'Conciliacao',
        dadosAnteriores,
        dadosNovos
      },
      usuarioId,
      request
    );
  }

  async registrarOperacaoConfiguracao(
    usuarioId: number,
    operacao: TipoOperacao,
    chave: string,
    dadosAnteriores?: any,
    dadosNovos?: any,
    request?: Request
  ) {
    return this.registrar(
      {
        tipo: TipoAuditoria.CONFIGURACAO,
        operacao,
        criticidade: NivelCriticidade.CRITICO,
        entidadeId: chave,
        entidadeTipo: 'Configuracao',
        dadosAnteriores,
        dadosNovos
      },
      usuarioId,
      request
    );
  }

  async buscarPorId(id: string): Promise<IRegistroAuditoria> {
    try {
      const registro = await this.auditoriaRepository.buscarPorId(id);
      
      if (!registro) {
        throw new Error(`Registro de auditoria ${id} não encontrado`);
      }

      return registro;
    } catch (error) {
      this.logger.error(`Erro ao buscar registro de auditoria ${id}`, error);
      throw error;
    }
  }

  async listarRegistros(filtros: FiltrarAuditoriaDTO) {
    try {
      const [registros, total] = await Promise.all([
        this.auditoriaRepository.listarPorFiltros({
          tipo: filtros.tipo,
          operacao: filtros.operacao,
          criticidade: filtros.criticidade,
          usuarioId: filtros.usuarioId,
          entidadeId: filtros.entidadeId,
          entidadeTipo: filtros.entidadeTipo,
          dataInicial: filtros.dataInicial ? new Date(filtros.dataInicial) : undefined,
          dataFinal: filtros.dataFinal ? new Date(filtros.dataFinal) : undefined
        }),
        this.auditoriaRepository.contarPorFiltros({
          tipo: filtros.tipo,
          operacao: filtros.operacao,
          criticidade: filtros.criticidade,
          usuarioId: filtros.usuarioId,
          entidadeId: filtros.entidadeId,
          entidadeTipo: filtros.entidadeTipo,
          dataInicial: filtros.dataInicial ? new Date(filtros.dataInicial) : undefined,
          dataFinal: filtros.dataFinal ? new Date(filtros.dataFinal) : undefined
        })
      ]);

      return {
        registros,
        total,
        filtros
      };
    } catch (error) {
      this.logger.error('Erro ao listar registros de auditoria', error);
      throw error;
    }
  }

  async obterEstatisticas() {
    try {
      return await this.auditoriaRepository.obterEstatisticas();
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de auditoria', error);
      throw error;
    }
  }
}
