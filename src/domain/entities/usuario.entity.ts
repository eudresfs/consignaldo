import { Role } from '../enums/role.enum';

export class Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  roles: Role[];
  ativo: boolean;
  ultimoAcesso?: Date;
  tentativasLogin: number;
  bloqueadoAte?: Date;
  vinculoAtual?: number;
}
