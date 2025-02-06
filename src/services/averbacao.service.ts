/**
 * Serviço de Averbação que orquestra a criação de contratos consignados.
 */
import { Averbacao, StatusContrato, IAverbacao } from '../domain/averbacao.entity';
import { CriarAverbacaoDto } from '../dtos/criar-averbacao.dto';
import { ValidacaoService } from './validacao.service';
import { MargemService } from './margem.service';
import { AverbacaoPrismaRepository } from '../repositories/averbacao.prisma.repository';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AverbacaoRepository } from '../repositories/averbacao.repository';
import { CreateAverbacaoDto } from '../dtos/averbacao.dto';
import { PaginatedResult } from '../types/common.types';

@Injectable()
export class AverbacaoService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly validacaoService: ValidacaoService = new ValidacaoService(),
    private readonly margemService: MargemService = new MargemService(),
    private readonly averbacaoRepository: AverbacaoPrismaRepository = new AverbacaoPrismaRepository(),
    private repository: AverbacaoRepository
  ) {}

  /**
   * Cria uma nova averbação após validar as regras de negócio e calcular a margem.
   * @param dto Dados para criação da averbação
   * @returns Averbação criada
   */
  async criarAverbacao(dto: CriarAverbacaoDto): Promise<IAverbacao> {
    // Executa as validações necessárias.
    await this.validacaoService.validarMargem(dto);
    
    // Calcula a margem disponível.
    const margemCalculada = await this.margemService.calcularMargem(dto);
    
    // Verifica se o valor da parcela não ultrapassa a margem disponível.
    if (dto.valorParcela > margemCalculada) {
      throw new Error(`Margem insuficiente: margem disponível = ${margemCalculada}, valor da parcela = ${dto.valorParcela}`);
    }

    // Instancia uma nova Averbacao com status padrão "Aguardando" (3).
    const novaAverbacao = new Averbacao(
      0, // O ID será definido pelo repositório
      dto.funcionarioId,
      new Date(dto.data),
      dto.valor,
      true
    );

    // Persiste a nova averbação e retorna o resultado.
    const result = await this.averbacaoRepository.criar(novaAverbacao);
    return result;
  }

  /**
   * Lista todas as Averbacões.
   */
  async listarAverbacoes(): Promise<IAverbacao[]> {
    return await this.averbacaoRepository.listar();
  }

  async findById(id: number): Promise<Averbacao | null> {
    const cacheKey = `averbacao:${id}`;
    const cached = await this.cacheManager.get<Averbacao>(cacheKey);
    if (cached) return cached;

    const averbacao = await this.repository.findById(id);
    if (averbacao) {
      await this.cacheManager.set(cacheKey, averbacao, 60 * 15); // 15 min
    }
    return averbacao;
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<Averbacao>> {
    return this.repository.findAll(page, limit);
  }

  async create(dto: CreateAverbacaoDto): Promise<Averbacao> {
    return this.repository.create(dto);
  }
} 