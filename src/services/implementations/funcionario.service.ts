import { Injectable } from '@nestjs/common';
import { FuncionarioRepository } from '../../repositories/implementations/funcionario.repository';
import { Funcionario } from '@prisma/client';

@Injectable()
export class FuncionarioService {
  constructor(private readonly funcionarioRepository: FuncionarioRepository) {}

  // Retorna um funcionário pelo ID
  async findById(id: number): Promise<Funcionario | null> {
    return this.funcionarioRepository.findById(id);
  }

  // Retorna um funcionário a partir da matrícula
  async findByMatricula(matricula: string): Promise<Funcionario | null> {
    return this.funcionarioRepository.findByMatricula(matricula);
  }
} 