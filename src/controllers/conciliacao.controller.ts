import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Conciliacao } from '../domain/conciliacao.entity';
import { ConciliacaoService } from '../services/conciliacao.service';

@ApiTags('Conciliacao')
@Controller('conciliacao')
export class ConciliacaoController {
  constructor(private readonly conciliacaoService: ConciliacaoService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna todas as conciliações' })
  async findAll(): Promise<Conciliacao[]> {
    return this.conciliacaoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna uma conciliação por id' })
  async findById(@Param('id') id: number): Promise<Conciliacao> {
    return this.conciliacaoService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova conciliação' })
  async create(@Body() data: Partial<Conciliacao>): Promise<Conciliacao> {
    return this.conciliacaoService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma conciliação existente' })
  async update(@Param('id') id: number, @Body() data: Partial<Conciliacao>): Promise<Conciliacao> {
    return this.conciliacaoService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma conciliação' })
  async remove(@Param('id') id: number): Promise<Conciliacao> {
    return this.conciliacaoService.delete(id);
  }
} 