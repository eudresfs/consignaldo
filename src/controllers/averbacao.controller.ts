import { Request, Response } from 'express';
import { AverbacaoService } from '../services/averbacao.service';
import { ErrorHandler } from '../middleware/error.handler';
import { CreateAverbacaoDto } from '../dtos/averbacao.dto';
import { Averbacao } from '../domain/averbacao.entity';
import { NotFoundException } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Post, Get, Param, Body } from '@nestjs/common';

/**
 * Controller para endpoints relacionados a Averbacão.
 */
export class AverbacaoController {
  private averbacaoService: AverbacaoService;

  constructor() {
    this.averbacaoService = new AverbacaoService();
  }

  /**
   * Endpoint para criar uma nova Averbacão.
   */
  @Post()
  @ApiOperation({ summary: 'Cria uma nova averbação' })
  @UsePipes(new ValidationPipe())
  async create(@Body() dto: CreateAverbacaoDto): Promise<Averbacao> {
    return this.averbacaoService.create(dto);
  }

  /**
   * Endpoint para listar Averbacões.
   */
  listarAverbacoes = async (req: Request, res: Response) => {
    try {
      const averbacoes = await this.averbacaoService.listarAverbacoes();
      return res.json(averbacoes);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };

  @Get(':id')
  @ApiOperation({ summary: 'Retorna uma averbação por id' })
  async findById(@Param('id') id: number): Promise<Averbacao> {
    const averbacao = await this.averbacaoService.findById(id);
    if (!averbacao) {
      throw new NotFoundException('Averbação não encontrada');
    }
    return averbacao;
  }
} 