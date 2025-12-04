import { supabase } from '@pei/database';

export type DisabilityType = 'deficiencia_intelectual' | 'autismo' | 'tdah' | 'deficiencia_visual' | 'deficiencia_auditiva' | 'deficiencia_fisica' | 'outro';
export type Stage = 'infantil' | 'fundamental_anos_iniciais' | 'fundamental_anos_finais' | 'medio';
export type StrategyCategory = 'comunicacao' | 'socializacao' | 'academico' | 'funcional';

export interface AEEStrategy {
  id: string;
  tenant_id?: string;
  disability_type: DisabilityType;
  stage?: Stage;
  strategy_name: string;
  strategy_description: string;
  category?: StrategyCategory;
  implementation_steps?: string[];
  resources_needed?: string[];
  expected_outcomes?: string[];
  usage_count: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AEEActivity {
  id: string;
  tenant_id?: string;
  disability_type: DisabilityType;
  stage?: Stage;
  activity_name: string;
  activity_description: string;
  category?: string;
  duration_minutes?: number;
  materials?: string[];
  instructions?: string;
  adaptations?: Record<string, any>;
  linked_strategies?: string[];
  usage_count: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const standardizationService = {
  /**
   * Busca estratégias por deficiência
   */
  async getStrategies(
    disabilityType: DisabilityType,
    stage?: Stage,
    category?: StrategyCategory,
    tenantId?: string
  ): Promise<AEEStrategy[]> {
    let query = supabase
      .from('aee_strategy_bank')
      .select('*')
      .eq('disability_type', disabilityType)
      .eq('enabled', true)
      .order('usage_count', { ascending: false });

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AEEStrategy[];
  },

  /**
   * Busca atividades por deficiência
   */
  async getActivities(
    disabilityType: DisabilityType,
    stage?: Stage,
    category?: string,
    tenantId?: string
  ): Promise<AEEActivity[]> {
    let query = supabase
      .from('aee_activity_bank')
      .select('*')
      .eq('disability_type', disabilityType)
      .eq('enabled', true)
      .order('usage_count', { ascending: false });

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AEEActivity[];
  },

  /**
   * Cria uma estratégia personalizada
   */
  async createStrategy(strategy: Partial<AEEStrategy>): Promise<AEEStrategy> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('aee_strategy_bank')
      .insert({
        ...strategy,
        enabled: strategy.enabled ?? true,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AEEStrategy;
  },

  /**
   * Cria uma atividade personalizada
   */
  async createActivity(activity: Partial<AEEActivity>): Promise<AEEActivity> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('aee_activity_bank')
      .insert({
        ...activity,
        enabled: activity.enabled ?? true,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AEEActivity;
  },

  /**
   * Incrementa contador de uso
   */
  async incrementUsage(type: 'strategy' | 'activity', id: string): Promise<void> {
    const table = type === 'strategy' ? 'aee_strategy_bank' : 'aee_activity_bank';
    const { error } = await supabase.rpc('increment_usage_count', {
      p_table_name: table,
      p_id: id,
    });

    if (error) {
      // Fallback: atualizar manualmente
      const { error: updateError } = await supabase
        .from(table)
        .update({ usage_count: supabase.raw('usage_count + 1') })
        .eq('id', id);

      if (updateError) throw updateError;
    }
  },
};

