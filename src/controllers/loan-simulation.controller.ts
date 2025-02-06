import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoanSimulationService } from '../services/implementations/loan-simulation.service';
import {
  LoanSimulation,
  RefinanceSimulation,
  PortabilitySimulation,
} from '../domain/interfaces/loan-simulation.interface';

class SimulateNewLoanDto {
  servidorId: number;
  consignatariaId: number;
  valorSolicitado: number;
  prazo: number;
}

class SimulateRefinanceDto {
  contratoId: string;
  valorSolicitado: number;
  prazo: number;
}

class SimulatePortabilityDto {
  contratoOrigemId: string;
  bancoOrigemId: number;
  prazo: number;
}

@ApiTags('Simulação de Empréstimo')
@Controller('loan-simulation')
@UseGuards(JwtAuthGuard)
export class LoanSimulationController {
  constructor(
    private readonly simulationService: LoanSimulationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Simular novo empréstimo' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Simulação realizada com sucesso',
    type: LoanSimulation,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Margem insuficiente ou prazo inválido',
  })
  async simulateNewLoan(
    @Body(ValidationPipe) dto: SimulateNewLoanDto,
  ): Promise<LoanSimulation> {
    return this.simulationService.simulateNewLoan(
      dto.servidorId,
      dto.consignatariaId,
      dto.valorSolicitado,
      dto.prazo,
    );
  }

  @Post('refinance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Simular refinanciamento' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Simulação de refinanciamento realizada com sucesso',
    type: RefinanceSimulation,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Contrato inválido ou margem insuficiente',
  })
  async simulateRefinance(
    @Body(ValidationPipe) dto: SimulateRefinanceDto,
  ): Promise<RefinanceSimulation> {
    return this.simulationService.simulateRefinance(
      dto.contratoId,
      dto.valorSolicitado,
      dto.prazo,
    );
  }

  @Post('portability')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Simular portabilidade' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Simulação de portabilidade realizada com sucesso',
    type: PortabilitySimulation,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Contrato inválido ou margem insuficiente',
  })
  async simulatePortability(
    @Body(ValidationPipe) dto: SimulatePortabilityDto,
  ): Promise<PortabilitySimulation> {
    return this.simulationService.simulatePortability(
      dto.contratoOrigemId,
      dto.bancoOrigemId,
      dto.prazo,
    );
  }
}
