import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentoRepository } from '../repositories/documento.repository';
import { StorageService } from './storage/storage.service';
import { AuditoriaService } from './auditoria.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { 
  TipoDocumento,
  StatusDocumento,
  TipoArmazenamento,
  IDocumento,
  IAnalisarDocumentoPayload 
} from '../domain/documentos/documento.types';
import { 
  CriarDocumentoDTO,
  AtualizarDocumentoDTO,
  FiltrarDocumentosDTO,
  AnalisarDocumentoDTO 
} from '../dtos/documentos/documento.dto';

@Injectable()
export class DocumentoService {
  private readonly logger = new Logger(DocumentoService.name);
  private readonly tipoArmazenamento: TipoArmazenamento;

  constructor(
    private readonly documentoRepository: DocumentoRepository,
    private readonly storageService: StorageService,
    private readonly auditoriaService: AuditoriaService,
    private readonly configService: ConfigService
  ) {
    this.tipoArmazenamento = this.configService.get('STORAGE_TYPE') as TipoArmazenamento;
  }

  async upload(
    arquivo: Buffer,
    nomeArquivo: string,
    mimeType: string,
    dto: CriarDocumentoDTO,
    usuarioId: number
  ): Promise<IDocumento> {
    try {
      // Validar tipo de arquivo permitido
      this.validarTipoArquivo(mimeType, dto.tipo);

      // Salvar arquivo no storage
      const { url, urlTemp, hash, tamanho } = await this.storageService.salvarArquivo(
        arquivo,
        nomeArquivo,
        mimeType,
        this.tipoArmazenamento
      );

      // Criar registro do documento
      const documento = await this.documentoRepository.criar({
        ...dto,
        nome: nomeArquivo,
        mimeType,
        tamanho,
        hash,
        url,
        urlTemp,
        status: StatusDocumento.PENDENTE,
        tipoArmazenamento: this.tipoArmazenamento,
        usuarioId
      });

      // Registrar auditoria
      await this.auditoriaService.registrar(
        {
          tipo: 'DOCUMENTO',
          operacao: 'CRIAR',
          criticidade: 'MEDIO',
          entidadeId: documento.id,
          entidadeTipo: 'Documento',
          dadosNovos: documento
        },
        usuarioId
      );

      return documento;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload do documento: ${error.message}`, error.stack);
      throw error;
    }
  }

  async atualizar(
    id: string,
    dto: AtualizarDocumentoDTO,
    usuarioId: number
  ): Promise<IDocumento> {
    try {
      const documentoExistente = await this.documentoRepository.buscarPorId(id);
      if (!documentoExistente) {
        throw new NotFoundException(`Documento ${id} não encontrado`);
      }

      const documento = await this.documentoRepository.atualizar(id, dto);

      // Registrar auditoria
      await this.auditoriaService.registrar(
        {
          tipo: 'DOCUMENTO',
          operacao: 'ATUALIZAR',
          criticidade: 'MEDIO',
          entidadeId: documento.id,
          entidadeTipo: 'Documento',
          dadosAnteriores: documentoExistente,
          dadosNovos: documento
        },
        usuarioId
      );

      return documento;
    } catch (error) {
      this.logger.error(`Erro ao atualizar documento: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deletar(id: string, usuarioId: number): Promise<void> {
    try {
      const documento = await this.documentoRepository.buscarPorId(id);
      if (!documento) {
        throw new NotFoundException(`Documento ${id} não encontrado`);
      }

      // Excluir arquivo do storage
      await this.storageService.excluirArquivo(
        documento.url,
        documento.tipoArmazenamento as TipoArmazenamento
      );

      // Excluir registro do banco
      await this.documentoRepository.deletar(id);

      // Registrar auditoria
      await this.auditoriaService.registrar(
        {
          tipo: 'DOCUMENTO',
          operacao: 'DELETAR',
          criticidade: 'ALTO',
          entidadeId: documento.id,
          entidadeTipo: 'Documento',
          dadosAnteriores: documento
        },
        usuarioId
      );
    } catch (error) {
      this.logger.error(`Erro ao deletar documento: ${error.message}`, error.stack);
      throw error;
    }
  }

  async analisar(
    id: string,
    dto: AnalisarDocumentoDTO,
    usuarioId: number
  ): Promise<IDocumento> {
    try {
      const documentoExistente = await this.documentoRepository.buscarPorId(id);
      if (!documentoExistente) {
        throw new NotFoundException(`Documento ${id} não encontrado`);
      }

      const documento = await this.documentoRepository.atualizarStatus(
        id,
        dto.status,
        dto.observacoes
      );

      // Registrar auditoria
      await this.auditoriaService.registrar(
        {
          tipo: 'DOCUMENTO',
          operacao: 'PROCESSAR',
          criticidade: 'ALTO',
          entidadeId: documento.id,
          entidadeTipo: 'Documento',
          dadosAnteriores: documentoExistente,
          dadosNovos: documento
        },
        usuarioId
      );

      return documento;
    } catch (error) {
      this.logger.error(`Erro ao analisar documento: ${error.message}`, error.stack);
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<IDocumento> {
    const documento = await this.documentoRepository.buscarPorId(id);
    if (!documento) {
      throw new NotFoundException(`Documento ${id} não encontrado`);
    }
    return documento;
  }

  async listar(filtros: FiltrarDocumentosDTO) {
    try {
      const [documentos, total] = await Promise.all([
        this.documentoRepository.listarPorFiltros({
          tipo: filtros.tipo,
          status: filtros.status,
          usuarioId: filtros.usuarioId,
          entidadeId: filtros.entidadeId,
          entidadeTipo: filtros.entidadeTipo,
          dataInicial: filtros.dataInicial ? new Date(filtros.dataInicial) : undefined,
          dataFinal: filtros.dataFinal ? new Date(filtros.dataFinal) : undefined,
          tags: filtros.tags
        }),
        this.documentoRepository.contarPorFiltros({
          tipo: filtros.tipo,
          status: filtros.status,
          usuarioId: filtros.usuarioId,
          entidadeId: filtros.entidadeId,
          entidadeTipo: filtros.entidadeTipo,
          dataInicial: filtros.dataInicial ? new Date(filtros.dataInicial) : undefined,
          dataFinal: filtros.dataFinal ? new Date(filtros.dataFinal) : undefined,
          tags: filtros.tags
        })
      ]);

      return {
        documentos,
        total,
        filtros
      };
    } catch (error) {
      this.logger.error(`Erro ao listar documentos: ${error.message}`, error.stack);
      throw error;
    }
  }

  async gerarUrlTemporaria(id: string): Promise<string> {
    try {
      const documento = await this.documentoRepository.buscarPorId(id);
      if (!documento) {
        throw new NotFoundException(`Documento ${id} não encontrado`);
      }

      return this.storageService.gerarUrlTemporaria(
        documento.url,
        documento.tipoArmazenamento as TipoArmazenamento
      );
    } catch (error) {
      this.logger.error(`Erro ao gerar URL temporária: ${error.message}`, error.stack);
      throw error;
    }
  }

  async obterEstatisticas() {
    try {
      return await this.documentoRepository.obterEstatisticas();
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async verificarDocumentosExpirados() {
    try {
      const documentos = await this.documentoRepository.buscarDocumentosExpirados();

      for (const documento of documentos) {
        await this.documentoRepository.atualizarStatus(
          documento.id,
          StatusDocumento.EXPIRADO,
          'Documento expirado automaticamente pelo sistema'
        );

        // Registrar auditoria
        await this.auditoriaService.registrar(
          {
            tipo: 'DOCUMENTO',
            operacao: 'PROCESSAR',
            criticidade: 'MEDIO',
            entidadeId: documento.id,
            entidadeTipo: 'Documento',
            dadosAnteriores: documento,
            dadosNovos: { ...documento, status: StatusDocumento.EXPIRADO }
          },
          0 // Sistema
        );
      }

      if (documentos.length > 0) {
        this.logger.log(`${documentos.length} documentos marcados como expirados`);
      }
    } catch (error) {
      this.logger.error(`Erro ao verificar documentos expirados: ${error.message}`, error.stack);
    }
  }

  private validarTipoArquivo(mimeType: string, tipo: TipoDocumento) {
    const tiposPermitidos = {
      [TipoDocumento.RG]: ['image/jpeg', 'image/png', 'application/pdf'],
      [TipoDocumento.CPF]: ['image/jpeg', 'image/png', 'application/pdf'],
      [TipoDocumento.COMPROVANTE_RESIDENCIA]: ['image/jpeg', 'image/png', 'application/pdf'],
      [TipoDocumento.COMPROVANTE_RENDA]: ['image/jpeg', 'image/png', 'application/pdf'],
      [TipoDocumento.CONTRATO]: ['application/pdf'],
      [TipoDocumento.TERMO_ADESAO]: ['application/pdf'],
      [TipoDocumento.PROCURACAO]: ['application/pdf'],
      [TipoDocumento.OUTROS]: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    if (!tiposPermitidos[tipo].includes(mimeType)) {
      throw new BadRequestException(`Tipo de arquivo não permitido para documento do tipo ${tipo}`);
    }
  }
}
