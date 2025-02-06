import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { AverbacaoRepository } from '../repositories/averbacao.repository';

@ValidatorConstraint({ name: 'AverbacaoExists', async: true })
@Injectable()
export class AverbacaoExistsRule implements ValidatorConstraintInterface {
  constructor(private repository: AverbacaoRepository) {}

  async validate(id: number) {
    const averbacao = await this.repository.findById(id);
    return averbacao !== null;
  }

  defaultMessage() {
    return 'Averbação não encontrada';
  }
} 