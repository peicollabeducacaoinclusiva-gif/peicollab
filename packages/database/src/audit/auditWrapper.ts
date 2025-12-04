import { SupabaseClient } from '@supabase/supabase-js';
import { getAuditLogger, EntityType, AuditAction } from './auditLogger';
import type { Database } from '../types';

/**
 * Wrapper para queries Supabase que registra automaticamente eventos de auditoria
 */
export class AuditWrapper {
  private logger = getAuditLogger();

  /**
   * Wraps uma query SELECT para registrar acesso de leitura
   */
  async select<T = any>(
    client: SupabaseClient<Database>,
    entityType: EntityType,
    tableName: string,
    query: ReturnType<typeof client.from<any>['select']>
  ): Promise<{ data: T[] | null; error: any }> {
    const result = await query;

    // Registrar leitura se houver dados
    if (result.data && result.data.length > 0) {
      for (const item of result.data) {
        if (item.id) {
          await this.logger.logRead(entityType, item.id, {
            table_name: tableName,
            record_count: result.data.length,
          });
        }
      }
    }

    return result;
  }

  /**
   * Wraps uma query INSERT para registrar criação
   */
  async insert<T = any>(
    client: SupabaseClient<Database>,
    entityType: EntityType,
    tableName: string,
    query: ReturnType<typeof client.from<any>['insert']>
  ): Promise<{ data: T[] | null; error: any }> {
    const result = await query;

    // Registrar criação se bem-sucedida
    if (result.data && result.data.length > 0) {
      for (const item of result.data) {
        if (item.id) {
          await this.logger.logInsert(entityType, item.id, {
            table_name: tableName,
          });
        }
      }
    }

    return result;
  }

  /**
   * Wraps uma query UPDATE para registrar atualização
   */
  async update<T = any>(
    client: SupabaseClient<Database>,
    entityType: EntityType,
    tableName: string,
    entityId: string,
    query: ReturnType<typeof client.from<any>['update']>,
    oldData?: any
  ): Promise<{ data: T[] | null; error: any }> {
    const result = await query;

    // Registrar atualização se bem-sucedida
    if (result.data && result.data.length > 0) {
      const newData = result.data[0];
      await this.logger.logUpdate(entityType, entityId, oldData, newData, {
        table_name: tableName,
      });
    }

    return result;
  }

  /**
   * Wraps uma query DELETE para registrar exclusão
   */
  async delete<T = any>(
    client: SupabaseClient<Database>,
    entityType: EntityType,
    tableName: string,
    entityId: string,
    query: ReturnType<typeof client.from<any>['delete']>
  ): Promise<{ data: T[] | null; error: any }> {
    const result = await query;

    // Registrar exclusão se bem-sucedida
    if (result.data && result.data.length > 0) {
      await this.logger.logDelete(entityType, entityId, {
        table_name: tableName,
      });
    }

    return result;
  }

  /**
   * Wraps uma chamada RPC para registrar acesso
   */
  async rpc<T = any>(
    client: SupabaseClient<Database>,
    entityType: EntityType,
    functionName: string,
    params: Record<string, any>,
    rpcCall: ReturnType<typeof client.rpc>
  ): Promise<{ data: T | null; error: any }> {
    const result = await rpcCall;

    // Registrar acesso se bem-sucedido e houver entity_id nos parâmetros
    if (result.data && params.entity_id) {
      await this.logger.logRead(entityType, params.entity_id, {
        function_name: functionName,
      });
    }

    return result;
  }
}

// Instância singleton
let auditWrapperInstance: AuditWrapper | null = null;

/**
 * Obtém instância singleton do AuditWrapper
 */
export function getAuditWrapper(): AuditWrapper {
  if (!auditWrapperInstance) {
    auditWrapperInstance = new AuditWrapper();
  }
  return auditWrapperInstance;
}

/**
 * Helper para usar o wrapper em queries comuns
 */
export async function withAudit<T>(
  entityType: EntityType,
  entityId: string,
  action: AuditAction,
  operation: () => Promise<T>
): Promise<T> {
  const logger = getAuditLogger();
  const result = await operation();
  
  // Registrar evento após operação bem-sucedida
  await logger.log(entityType, entityId, action);
  
  return result;
}

