import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BankIntegrationService } from '../services/bank-integration.service';
import { AuthGuard } from '../infrastructure/auth/auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../infrastructure/auth/roles.decorator';
import { BankWebhookPayload } from '../domain/interfaces/bank-integration.interface';

@ApiTags('Integração com Bancos')
@Controller('bank-integration')
@UseGuards(AuthGuard, RolesGuard)
export class BankIntegrationController {
  constructor(
    private readonly bankIntegrationService: BankIntegrationService,
  ) {}

  @Post('import/:bankId')
  @Roles('ADMIN', 'SYSTEM')
  @ApiOperation({ summary: 'Importa propostas do banco' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Propostas importadas com sucesso' })
  async importProposals(
    @Param('bankId', ParseIntPipe) bankId: number,
  ) {
    return this.bankIntegrationService.importProposals(bankId);
  }

  @Post('export/:contractId/:bankId')
  @Roles('ADMIN', 'SYSTEM')
  @ApiOperation({ summary: 'Exporta contrato para o banco' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Contrato exportado com sucesso' })
  async exportContract(
    @Param('contractId') contractId: string,
    @Param('bankId', ParseIntPipe) bankId: number,
  ) {
    await this.bankIntegrationService.exportContract(contractId, bankId);
    return { message: 'Contrato exportado com sucesso' };
  }

  @Post('webhook/:bankId')
  @ApiOperation({ summary: 'Recebe webhook do banco' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processado com sucesso' })
  async handleWebhook(
    @Param('bankId', ParseIntPipe) bankId: number,
    @Body() payload: BankWebhookPayload,
  ) {
    await this.bankIntegrationService.handleWebhook(payload, bankId);
    return { message: 'Webhook processado com sucesso' };
  }
}
