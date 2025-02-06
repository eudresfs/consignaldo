import { AuditAction } from '../enums/audit-action.enum';
import { AuditResource } from '../enums/audit-resource.enum';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | number;
  userId?: number;
  username?: string;
  consignanteId?: number;
  ip?: string;
  userAgent?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string | number;
  userId?: number;
  username?: string;
  consignanteId?: number;
  status?: 'SUCCESS' | 'ERROR';
}

export interface AuditConfig {
  enabled: boolean;
  resources: {
    [key in AuditResource]?: {
      actions: AuditAction[];
      trackChanges?: boolean;
      maskFields?: string[];
    };
  };
  retention: {
    days: number;
    maxSize: number;  // em MB
  };
}

export interface AuditStats {
  totalEvents: number;
  periodStart: Date;
  periodEnd: Date;
  byAction: Record<AuditAction, number>;
  byResource: Record<AuditResource, number>;
  byStatus: {
    success: number;
    error: number;
  };
  topUsers: Array<{
    userId: number;
    username: string;
    count: number;
  }>;
  topErrors: Array<{
    error: string;
    count: number;
  }>;
}
