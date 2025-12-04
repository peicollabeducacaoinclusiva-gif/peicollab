import { supabase } from '../client';
import { getAuditLogger } from '../audit';

export type RetentionEntityType = 
  | 'student'
  | 'user'
  | 'guardian'
  | 'professional'
  | 'pei'
  | 'aee'
  | 'enrollment'
  | 'grade'
  | 'attendance'
  | 'audit_event'
  | 'consent'
  | 'dsr_request';

export type AnonymizationStrategy = 'full' | 'partial' | 'delete' | 'archive';

export type RetentionAction = 'anonymized' | 'deleted' | 'archived';

export interface RetentionRule {
  id: string;
  tenant_id: string;
  entity_type: RetentionEntityType;
  retention_period_days: number;
  anonymization_strategy: AnonymizationStrategy;
  anonymize_fields: string[];
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RetentionLog {
  id: string;
  tenant_id: string;
  rule_id?: string;
  entity_type: string;
  entity_id: string;
  action: RetentionAction;
  anonymized_fields?: string[];
  retention_period_days?: number;
  original_created_at?: string;
  processed_at: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ApplyRetentionResult {
  success: boolean;
  tenant_id: string;
  dry_run: boolean;
  total_rules_processed: number;
  total_anonymized: number;
  total_deleted: number;
  total_archived: number;
  errors: Array<{
    rule_id: string;
    entity_type: string;
    error: string;
  }>;
  processed_at: string;
}

export interface CreateRetentionRuleParams {
  tenantId: string;
  entityType: RetentionEntityType;
  retentionPeriodDays: number;
  anonymizationStrategy: AnonymizationStrategy;
  anonymizeFields?: string[];
  description?: string;
}

/**
 * Serviço de gerenciamento de retenção e anonimização de dados
 */
export const retentionService = {
  /**
   * Cria ou atualiza uma regra de retenção
   */
  async upsertRule(params: CreateRetentionRuleParams): Promise<string> {
    const { data, error } = await supabase.rpc('upsert_retention_rule', {
      p_tenant_id: params.tenantId,
      p_entity_type: params.entityType,
      p_retention_period_days: params.retentionPeriodDays,
      p_anonymization_strategy: params.anonymizationStrategy,
      p_anonymize_fields: params.anonymizeFields || [],
      p_description: params.description || null,
    });

    if (error) {
      console.error('Erro ao criar/atualizar regra de retenção:', error);
      throw error;
    }

    return data || '';
  },

  /**
   * Busca todas as regras de retenção de um tenant
   */
  async getRules(tenantId: string): Promise<RetentionRule[]> {
    const { data, error } = await supabase.rpc('get_retention_rules', {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error('Erro ao buscar regras de retenção:', error);
      throw error;
    }

    return (data || []) as RetentionRule[];
  },

  /**
   * Aplica regras de retenção para um tenant
   */
  async applyRules(
    tenantId: string,
    options: { dryRun?: boolean } = {}
  ): Promise<ApplyRetentionResult> {
    const { data, error } = await supabase.rpc('apply_retention_rules', {
      p_tenant_id: tenantId,
      p_dry_run: options.dryRun || false,
    });

    if (error) {
      console.error('Erro ao aplicar regras de retenção:', error);
      throw error;
    }

    return data as ApplyRetentionResult;
  },

  /**
   * Busca logs de retenção
   */
  async getLogs(filters: {
    tenantId: string;
    ruleId?: string;
    entityType?: string;
    limit?: number;
  }): Promise<RetentionLog[]> {
    let query = supabase
      .from('retention_logs')
      .select('*')
      .eq('tenant_id', filters.tenantId)
      .order('processed_at', { ascending: false })
      .limit(filters.limit || 100);

    if (filters.ruleId) {
      query = query.eq('rule_id', filters.ruleId);
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar logs de retenção:', error);
      throw error;
    }

    return (data || []) as RetentionLog[];
  },

  /**
   * Ativa ou desativa uma regra de retenção
   */
  async toggleRule(ruleId: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('data_retention_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId);

    if (error) {
      console.error('Erro ao atualizar regra de retenção:', error);
      throw error;
    }

    return true;
  },

  /**
   * Remove uma regra de retenção
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('data_retention_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Erro ao remover regra de retenção:', error);
      throw error;
    }

    return true;
  },
};

