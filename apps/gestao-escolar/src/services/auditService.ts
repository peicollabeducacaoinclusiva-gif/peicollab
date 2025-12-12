import { supabase } from '@pei/database';
import { auditMiddleware, type AuditAction as AuditActionType, type AuditEntityType } from '@pei/database/audit';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'READ' | 'EXPORT' | 'ANONYMIZE';

// Interface AuditLog mantida para compatibilidade retroativa
export interface AuditLog {
  id: string;
  table_name: string; // Mapeado de entity_type
  record_id: string; // Mapeado de entity_id
  action: AuditAction;
  old_data?: any; // Mapeado de metadata.old_values
  new_data?: any; // Mapeado de metadata.new_values
  changed_by?: string; // Mapeado de actor_id
  changed_at: string; // Mapeado de created_at
  ip_address?: string;
  user_agent?: string;
  tenant_id?: string; // Novo campo
}

// Interface para dados retornados do RPC get_audit_trail
interface AuditTrailItem {
  id: string;
  tenant_id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AccessLog {
  id: string;
  user_id?: string;
  action: string;
  resource?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface AuditHistoryItem extends AuditLog {
  changed_by_name?: string;
  changed_by_email?: string;
  tenant_id?: string;
}

export const auditService = {
  /**
   * Registra um log de acesso
   */
  async logAccess(
    action: string,
    resource?: string,
    resourceId?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('log_access', {
      p_action: action,
      p_resource: resource || null,
      p_resource_id: resourceId || null,
      p_success: success,
      p_error_message: errorMessage || null,
    });

    if (error) {
      console.error('Erro ao registrar log de acesso:', error);
      // Não lançar erro para não interromper o fluxo principal
      return '';
    }

    return data || '';
  },

  /**
   * Busca histórico de alterações de um registro específico
   * Agora usa audit_events via RPC get_audit_trail
   */
  async getAuditHistory(
    tableName: string,
    recordId: string,
    limit: number = 50,
    tenantId?: string
  ): Promise<AuditHistoryItem[]> {
    // Obter tenant_id se não fornecido
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        if (profile?.tenant_id) {
          resolvedTenantId = profile.tenant_id;
        }
      }
    }

    if (!resolvedTenantId) {
      throw new Error('tenantId é obrigatório para buscar histórico de auditoria');
    }

    // Usar RPC get_audit_trail (usa audit_events)
    const { data, error } = await supabase.rpc('get_audit_trail', {
      p_tenant_id: resolvedTenantId,
      p_entity_type: tableName,
      p_entity_id: recordId as any,
      p_action: null,
      p_actor_id: null,
      p_start_date: null,
      p_end_date: null,
      p_limit: limit,
    });

    if (error) throw error;

    // Mapear para formato AuditHistoryItem (compatibilidade retroativa)
    return (data || []).map((item: AuditTrailItem) => ({
      id: item.id,
      table_name: item.entity_type,
      record_id: item.entity_id,
      action: item.action as AuditAction,
      old_data: (item.metadata?.old_values as any) || undefined,
      new_data: (item.metadata?.new_values as any) || undefined,
      changed_by: item.actor_id || undefined,
      changed_at: item.created_at,
      ip_address: item.ip_address || undefined,
      user_agent: item.user_agent || undefined,
      tenant_id: item.tenant_id,
      changed_by_name: item.actor_name || undefined,
      changed_by_email: item.actor_email || undefined,
    })) as AuditHistoryItem[];
  },

  /**
   * Busca logs de acesso de um usuário
   * Usa get_audit_trail quando tenantId está disponível, fallback para get_user_access_logs
   */
  async getUserAccessLogs(userId: string, limit: number = 100, tenantId?: string): Promise<AccessLog[]> {
    // Se tivermos tenantId, usar get_audit_trail filtrando por actor_id
    if (tenantId) {
      const { data, error } = await supabase.rpc('get_audit_trail', {
        p_tenant_id: tenantId,
        p_entity_type: null,
        p_entity_id: null,
        p_action: null,
        p_actor_id: userId as any,
        p_start_date: null,
        p_end_date: null,
        p_limit: limit,
      });

      if (error) throw error;

      // Mapear para AccessLog
      return (data || []).map((item: AuditTrailItem) => ({
        id: item.id,
        user_id: item.actor_id || undefined,
        action: item.action,
        resource: item.entity_type,
        resource_id: item.entity_id,
        ip_address: item.ip_address || undefined,
        user_agent: item.user_agent || undefined,
        success: true, // Assumir sucesso se está em audit_events
        error_message: undefined,
        created_at: item.created_at,
      })) as AccessLog[];
    }

    // Fallback para RPC antigo se não tiver tenantId
    try {
      const { data, error } = await supabase.rpc('get_user_access_logs', {
        p_user_id: userId,
        p_limit: limit,
      });

      if (error) throw error;
      
      // Mapear resultado do RPC antigo para AccessLog[]
      return (data || []).map((item: any) => ({
        id: item.id || '',
        user_id: item.user_id || userId,
        action: item.action || '',
        resource: item.resource || undefined,
        resource_id: item.resource_id || undefined,
        ip_address: item.ip_address || undefined,
        user_agent: item.user_agent || undefined,
        success: item.success !== undefined ? item.success : true,
        error_message: item.error_message || undefined,
        created_at: item.created_at || new Date().toISOString(),
      })) as AccessLog[];
    } catch (err) {
      // Se o RPC não existir, retornar array vazio
      console.warn('RPC get_user_access_logs não disponível, retornando logs vazios');
      return [];
    }
  },

  /**
   * Busca logs de auditoria com filtros
   * Agora usa audit_events via RPC get_audit_trail
   */
  async getAuditLogs(filters: {
    tableName?: string;
    recordId?: string;
    action?: AuditAction;
    changedBy?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    tenantId?: string;
  }): Promise<AuditLog[]> {
    // Obter tenant_id se não fornecido
    let tenantId = filters.tenantId;
    if (!tenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        if (profile?.tenant_id) {
          tenantId = profile.tenant_id;
        }
      }
    }

    if (!tenantId) {
      throw new Error('tenantId é obrigatório para buscar logs de auditoria');
    }

    // Usar RPC get_audit_trail (usa audit_events)
    const { data, error } = await supabase.rpc('get_audit_trail', {
      p_tenant_id: tenantId,
      p_entity_type: filters.tableName || null,
      p_entity_id: filters.recordId ? (filters.recordId as any) : null,
      p_action: filters.action || null,
      p_actor_id: filters.changedBy ? (filters.changedBy as any) : null,
      p_start_date: filters.startDate || null,
      p_end_date: filters.endDate || null,
      p_limit: filters.limit || 100,
    });

    if (error) throw error;

    // Mapear para formato AuditLog (compatibilidade retroativa)
    return (data || []).map((item: AuditTrailItem) => ({
      id: item.id,
      table_name: item.entity_type, // Mapeado de entity_type
      record_id: item.entity_id, // Mapeado de entity_id
      action: item.action as AuditAction,
      old_data: (item.metadata?.old_values as any) || undefined,
      new_data: (item.metadata?.new_values as any) || undefined,
      changed_by: item.actor_id || undefined,
      changed_at: item.created_at, // Mapeado de created_at
      ip_address: item.ip_address || undefined,
      user_agent: item.user_agent || undefined,
      tenant_id: item.tenant_id,
    })) as AuditLog[];
  },

  /**
   * Busca logs de acesso com filtros
   */
  async getAccessLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AccessLog[]> {
    let query = supabase
      .from('access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100);

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource) {
      query = query.eq('resource', filters.resource);
    }

    if (filters.success !== undefined) {
      query = query.eq('success', filters.success);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AccessLog[];
  },

  /**
   * Exporta logs de auditoria para CSV
   */
  async exportAuditLogs(filters: {
    tableName?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> {
    const logs = await this.getAuditLogs({
      ...filters,
      limit: 10000, // Limite alto para exportação
    });

    // Converter para CSV
    const headers = ['ID', 'Tabela', 'Registro', 'Ação', 'Alterado Por', 'Data/Hora', 'IP'];
    const rows = logs.map((log) => [
      log.id,
      log.table_name,
      log.record_id,
      log.action,
      log.changed_by || '',
      new Date(log.changed_at).toLocaleString('pt-BR'),
      log.ip_address || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  },
};



