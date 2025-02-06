import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { PayrollService } from '../services/payroll.service';
import { AuthGuard } from '../infrastructure/auth/auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../infrastructure/auth/roles.decorator';
import { PayrollImport, PayrollReconciliation } from '../domain/interfaces/payroll.interface';

@ApiTags('Folha de Pagamento')
@Controller('payroll')
@UseGuards(AuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('import/:consignanteId')
  @Roles('ADMIN', 'GESTOR')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importa arquivo de folha de pagamento' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.OK, type: PayrollImport })
  async importPayroll(
    @Param('consignanteId', ParseIntPipe) consignanteId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('competencia') competencia: string,
  ): Promise<PayrollImport> {
    return this.payrollService.importPayroll(consignanteId, file, competencia);
  }

  @Get('import/:id')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Busca status da importação' })
  @ApiResponse({ status: HttpStatus.OK, type: PayrollImport })
  async getImportStatus(
    @Param('id') id: string,
  ): Promise<PayrollImport> {
    return this.payrollService.getImportStatus(id);
  }

  @Post('import/:id/reconcile')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Inicia reconciliação da folha' })
  @ApiResponse({ status: HttpStatus.OK, type: [PayrollReconciliation] })
  async reconcilePayroll(
    @Param('id') id: string,
  ): Promise<PayrollReconciliation[]> {
    return this.payrollService.reconcilePayroll(id);
  }

  @Get('import/:id/reconciliation')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Busca resultado da reconciliação' })
  @ApiResponse({ status: HttpStatus.OK, type: [PayrollReconciliation] })
  async getReconciliationResult(
    @Param('id') id: string,
  ): Promise<PayrollReconciliation[]> {
    return this.payrollService.getReconciliationResult(id);
  }
}
