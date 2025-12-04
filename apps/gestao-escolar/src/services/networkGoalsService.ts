import { supabase } from '@pei/database';

export type MetricType = 'pei_coverage' | 'aee_coverage' | 'attendance_rate' | 'goal_achievement';

export interface NetworkGoal {
  id: string;
  tenant_id: string;
  goal_name: string;
  goal_description?: string;
  target_value: number;
  current_value: number;
  metric_type: MetricType;
  target_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const networkGoalsService = {
  /**
   * Busca metas da rede
   */
  async getNetworkGoals(tenantId: string, status?: string): Promise<NetworkGoal[]> {
    let query = supabase
      .from('network_goals')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as NetworkGoal[];
  },

  /**
   * Cria uma meta da rede
   */
  async createGoal(goal: Partial<NetworkGoal>): Promise<NetworkGoal> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('network_goals')
      .insert({
        ...goal,
        created_by: user?.id,
        status: goal.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as NetworkGoal;
  },

  /**
   * Atualiza uma meta
   */
  async updateGoal(goalId: string, updates: Partial<NetworkGoal>): Promise<NetworkGoal> {
    const { data, error } = await supabase
      .from('network_goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as NetworkGoal;
  },

  /**
   * Atualiza valor atual da meta baseado em indicadores
   */
  async updateGoalProgress(goalId: string): Promise<void> {
    const { data: goal, error: goalError } = await supabase
      .from('network_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalError) throw goalError;

    // Calcular valor atual baseado no tipo de métrica
    const indicators = await supabase.rpc('calculate_inclusion_indicators', {
      p_tenant_id: goal.tenant_id,
      p_school_id: null,
    });

    let currentValue = 0;

    switch (goal.metric_type) {
      case 'pei_coverage':
        currentValue = indicators.data?.students?.pei_coverage || 0;
        break;
      case 'aee_coverage':
        currentValue = indicators.data?.students?.aee_coverage || 0;
        break;
      case 'attendance_rate':
        currentValue = indicators.data?.attendance?.average_rate || 0;
        break;
      case 'goal_achievement':
        currentValue = indicators.data?.pei?.achievement_rate || 0;
        break;
    }

    // Atualizar meta
    await supabase
      .from('network_goals')
      .update({
        current_value: currentValue,
        status: currentValue >= goal.target_value ? 'completed' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId);
  },
};

