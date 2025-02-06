export interface PayrollImport {
  id: string;
  consignanteId: number;
  competencia: string;
  fileName: string;
  status: PayrollStatus;
  totalRecords: number;
  processedRecords: number;
  errors: PayrollError[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRecord {
  matricula: string;
  cpf: string;
  nome: string;
  salarioBruto: number;
  salarioLiquido: number;
  margemDisponivel: number;
  margemUtilizada: number;
  descontos: PayrollDiscount[];
}

export interface PayrollDiscount {
  codigo: string;
  descricao: string;
  valor: number;
  consignatariaId?: number;
  contratoId?: string;
}

export interface PayrollError {
  line: number;
  column: string;
  value: string;
  error: string;
}

export enum PayrollStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED'
}

export interface PayrollTemplate {
  id: number;
  consignanteId: number;
  name: string;
  delimiter: string;
  encoding: string;
  skipLines: number;
  columns: PayrollColumn[];
  active: boolean;
}

export interface PayrollColumn {
  name: string;
  position: number;
  type: 'string' | 'number' | 'date';
  format?: string;
  required: boolean;
  validation?: string;
}

export interface PayrollReconciliation {
  id: string;
  payrollId: string;
  contractId: string;
  status: ReconciliationStatus;
  expectedValue: number;
  actualValue: number;
  difference: number;
  action: ReconciliationAction;
}

export enum ReconciliationStatus {
  MATCHED = 'MATCHED',
  DIVERGENT = 'DIVERGENT',
  MISSING = 'MISSING',
  EXTRA = 'EXTRA'
}

export enum ReconciliationAction {
  NONE = 'NONE',
  UPDATE = 'UPDATE',
  SUSPEND = 'SUSPEND',
  NOTIFY = 'NOTIFY'
}
