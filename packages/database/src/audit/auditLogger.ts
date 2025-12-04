import { supabase } from '../client';

export type AuditAction = 'READ' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ANONYMIZE';

export type EntityType = 
  | 'student' 
  | 'pei' 
  | 'aee' 
  | 'professional' 
  | 'enrollment' 
  | 'grade' 
  | 'attendance' 
  | 'class'
  | 'school'
  | 'tenant';

export interface AuditEventMetadata {
  [key: string]: unknown;
  table_name?: string;
  old_data?: unknown;
  new_data?: unknown;
  reason?: string;
  description?: string;
}

export interface AuditEvent {
  id: string;
  tenant_id: string;
  actor_id?: string;
  entity_type: EntityType;
  entity_id: string;
  action: AuditAction;
  ip_address?: string;
  user_agent?: string;
  metadata: AuditEventMetadata;
  created_at: string;
}

export interface AuditTrailFilters {
  entity_type?: EntityType;
  entity_id?: string;
  action?: AuditAction;
  actor_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface AuditTrailItem extends AuditEvent {
  actor_name?: string;
  actor_email?: string;
}

/**
 * Logger de auditoria para registrar eventos de acesso a dados pessoais
 * Conforme LGPD - Lei Geral de Proteção de Dados
 */
export class AuditLogger {
  private tenantId: string | null = null;

  /**
   * Define o tenant_id atual para os logs
   */
  setTenantId(tenantId: string | null): void {
    this.tenantId = tenantId;
  }

  /**
   * Obtém o tenant_id atual
   */
  getTenantId(): string | null {
    return this.tenantId;
  }

  /**
   * Registra um evento de auditoria
   */
  async log(
    entityType: EntityType,
    entityId: string,
    action: AuditAction,
    metadata: AuditEventMetadata = {}
  ): Promise<string | null> {
    if (!this.tenantId) {
      console.warn('AuditLogger: tenant_id não definido. Evento não será registrado.');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('log_audit_event', {
        p_tenant_id: this.tenantId,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_action: action,
        p_metadata: metadata,
      });

      if (error) {
        console.error('Erro ao registrar evento de auditoria:', error);
        // Não lançar erro para não interromper o fluxo principal
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Erro inesperado ao registrar evento de auditoria:', error);
      return null;
    }
  }

  /**
   * Registra acesso de leitura a dados pessoais
   */
  async logRead(
    entityType: EntityType,
    entityId: string,
    metadata: AuditEventMetadata = {}
  ): Promise<string | null> {
    return this.log(entityType, entityId, 'READ', metadata);
  }

  /**
   * Registra criação de dados pessoais
   */
  async logInsert(
    entityType: EntityType,
    entityId: string,
    metadata: AuditEventMetadata = {}
  ): Promise<string | null> {
    return this.log(entityType, entityId, 'INSERT', metadata);
  }

  /**
   * Registra atualização de dados pessoais
   */
  async logUpdate(
    entityType: EntityType,
    entityId: string,
    oldData: unknown,
    newData: unknown,
    metadata: AuditEventMetadata = {}
  ): Promise<string | null> {
    return this.log(entityType, entityId, 'UPDATE', {
      ...metadata,
      old_data: oldData,
      new_data: newData,
    });
  }

  /**
   * Registra exclusão de dados pessoais
   */
  async logDelete(
    entityType: EntityType,
    entityId: string,
    metadata: AuditEventMetadata = {}
  ): Promise<string | null> {
    return this.log(entityType, entityId, 'DELETE', metadata);
  }

  /**
   * Registra exportação de dados pessoais (portabilidade)
   */
  async logExport(
    entityType: EntityType,
    entityId: string,
    metadata: AuditEventMetadata = {}
  ): Promise<string | null> {
    return this.log(entityType, entityId, 'EXPORT', metadata);
  }

  /**
   * Registra anonimização de dados pessoais
   */
  async logAnonymize(
    entityType: EntityType,
    entityId: string,
    reason: string,
    metadata: AuditEventMetadata = {}
  ): Promise<string | null> {
    return this.log(entityType, entityId, 'ANONYMIZE', {
      ...metadata,
      reason,
    });
  }

  /**
   * Busca trail de auditoria com filtros
   */
  async getAuditTrail(filters: AuditTrailFilters = {}): Promise<AuditTrailItem[]> {
    if (!this.tenantId) {
      console.warn('AuditLogger: tenant_id não definido. Não é possível buscar trail.');
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('get_audit_trail', {
        p_tenant_id: this.tenantId,
        p_entity_type: filters.entity_type || null,
        p_entity_id: filters.entity_id || null,
        p_action: filters.action || null,
        p_actor_id: filters.actor_id || null,
        p_start_date: filters.start_date || null,
        p_end_date: filters.end_date || null,
        p_limit: filters.limit || 100,
      });

      if (error) {
        console.error('Erro ao buscar trail de auditoria:', error);
        throw error;
      }

      return (data || []) as AuditTrailItem[];
    } catch (error) {
      console.error('Erro inesperado ao buscar trail de auditoria:', error);
      throw error;
    }
  }
}

// Instância singleton
let auditLoggerInstance: AuditLogger | null = null;

/**
 * Obtém instância singleton do AuditLogger
 */
export function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

/**
 * Cria uma nova instância do AuditLogger
 */
export function createAuditLogger(tenantId?: string): AuditLogger {
  const logger = new AuditLogger();
  if (tenantId) {
    logger.setTenantId(tenantId);
  }
  return logger;
}

