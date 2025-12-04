/**
 * Middleware de Auditoria
 * 
 * Fornece funções helper para gravar eventos de auditoria em operações críticas.
 * Integra automaticamente com a tabela audit_events.
 */

import { supabase } from '../client';

export type AuditAction = 'READ' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ANONYMIZE';

export type AuditEntityType = 
  | 'student'
  | 'pei'
  | 'aee'
  | 'professional'
  | 'user'
  | 'guardian'
  | 'consent'
  | 'dsr_request'
  | 'enrollment'
  | 'class'
  | 'school'
  | 'tenant'
  | 'system'; // Adicionado para eventos de sistema

export interface AuditMetadata {
  [key: string]: unknown;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  change_summary?: string;
  reason?: string;
  resource_url?: string;
}

export interface AuditEventParams {
  tenantId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  metadata?: AuditMetadata;
  actorId?: string;
}

/**
 * Serviço de auditoria para gravar eventos automaticamente
 */
export const auditMiddleware = {
  /**
   * Grava um evento de auditoria
   */
  async logEvent(params: AuditEventParams): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_audit_event', {
        p_tenant_id: params.tenantId,
        p_entity_type: params.entityType,
        p_entity_id: params.entityId,
        p_action: params.action,
        p_metadata: params.metadata || {},
      });

      if (error) {
        console.error('Erro ao gravar evento de auditoria:', error);
        // Não lançar erro para não quebrar o fluxo principal
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Erro ao gravar evento de auditoria:', error);
      return null;
    }
  },

  /**
   * Helper para gravar criação de entidade
   */
  async logCreate(
    tenantId: string,
    entityType: AuditEntityType,
    entityId: string,
    metadata?: AuditMetadata
  ): Promise<string | null> {
    return this.logEvent({
      tenantId,
      entityType,
      entityId,
      action: 'INSERT',
      metadata,
    });
  },

  /**
   * Helper para gravar atualização de entidade
   */
  async logUpdate(
    tenantId: string,
    entityType: AuditEntityType,
    entityId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    changeSummary?: string
  ): Promise<string | null> {
    return this.logEvent({
      tenantId,
      entityType,
      entityId,
      action: 'UPDATE',
      metadata: {
        old_values: oldValues,
        new_values: newValues,
        change_summary: changeSummary,
      },
    });
  },

  /**
   * Helper para gravar exclusão de entidade
   */
  async logDelete(
    tenantId: string,
    entityType: AuditEntityType,
    entityId: string,
    metadata?: AuditMetadata
  ): Promise<string | null> {
    return this.logEvent({
      tenantId,
      entityType,
      entityId,
      action: 'DELETE',
      metadata,
    });
  },

  /**
   * Helper para gravar leitura/export de dados sensíveis
   */
  async logRead(
    tenantId: string,
    entityType: AuditEntityType,
    entityId: string,
    metadata?: AuditMetadata
  ): Promise<string | null> {
    return this.logEvent({
      tenantId,
      entityType,
      entityId,
      action: 'READ',
      metadata,
    });
  },

  /**
   * Helper para gravar export de dados pessoais
   */
  async logExport(
    tenantId: string,
    entityType: AuditEntityType,
    entityId: string,
    metadata?: AuditMetadata
  ): Promise<string | null> {
    return this.logEvent({
      tenantId,
      entityType,
      entityId,
      action: 'EXPORT',
      metadata,
    });
  },

  /**
   * Helper para gravar anonimização de dados
   */
  async logAnonymize(
    tenantId: string,
    entityType: AuditEntityType,
    entityId: string,
    reason: string,
    metadata?: AuditMetadata
  ): Promise<string | null> {
    return this.logEvent({
      tenantId,
      entityType,
      entityId,
      action: 'ANONYMIZE',
      metadata: {
        ...metadata,
        reason,
      },
    });
  },
};

/**
 * Wrapper para instrumentar funções assíncronas com auditoria automática
 */
export function withAudit<T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>,
  options: {
    tenantId: string | ((...args: T) => string);
    entityType: AuditEntityType | ((...args: T) => AuditEntityType);
    entityId: string | ((...args: T) => string);
    action: AuditAction;
    metadata?: AuditMetadata | ((...args: T) => AuditMetadata);
  }
): (...args: T) => Promise<unknown> {
  return async (...args: T) => {
    try {
      const tenantId = typeof options.tenantId === 'function' 
        ? options.tenantId(...args) 
        : options.tenantId;
      
      const entityType = typeof options.entityType === 'function'
        ? options.entityType(...args)
        : options.entityType;
      
      const entityId = typeof options.entityId === 'function'
        ? options.entityId(...args)
        : options.entityId;

      const metadata = typeof options.metadata === 'function'
        ? options.metadata(...args)
        : options.metadata;

      const result = await fn(...args);

      // Gravar auditoria após sucesso
      await auditMiddleware.logEvent({
        tenantId,
        entityType,
        entityId,
        action: options.action,
        metadata,
      });

      return result;
    } catch (error) {
      // Gravar erro na auditoria se necessário
      console.error('Erro na função instrumentada:', error);
      throw error;
    }
  };
}

