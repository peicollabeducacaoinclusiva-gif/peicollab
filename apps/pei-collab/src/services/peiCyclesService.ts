import { supabase } from '@/integrations/supabase/client';

export interface PEICycle {
  id: string;
  pei_id: string;
  cycle_number: number;
  cycle_name?: string;
  start_date: string;
  end_date: string;
  evaluation?: Record<string, any>;
  goals_summary?: Array<{
    goal_id: string;
    goal_description: string;
    progress_level: string;
  }>;
  observations?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateCycleParams {
  peiId: string;
  cycleNumber: number;
  cycleName?: string;
  startDate: string;
  endDate: string;
}

export const peiCyclesService = {
  /**
   * Cria ciclos padrão para um PEI
   */
  async createDefaultCycles(peiId: string): Promise<void> {
    const { error } = await supabase.rpc('create_default_pei_cycles', {
      p_pei_id: peiId,
    });

    if (error) throw error;
  },

  /**
   * Busca todos os ciclos de um PEI
   */
  async getCycles(peiId: string): Promise<PEICycle[]> {
    const { data, error } = await supabase
      .from('pei_cycles')
      .select('*')
      .eq('pei_id', peiId)
      .order('cycle_number', { ascending: true });

    if (error) throw error;
    return (data || []) as PEICycle[];
  },

  /**
   * Busca ciclo atual ativo
   */
  async getCurrentCycle(peiId: string): Promise<PEICycle | null> {
    const { data, error } = await supabase.rpc('get_current_pei_cycle', {
      p_pei_id: peiId,
    });

    if (error) throw error;
    return (data && data.length > 0 ? data[0] : null) as PEICycle | null;
  },

  /**
   * Cria um novo ciclo
   */
  async createCycle(params: CreateCycleParams): Promise<PEICycle> {
    const { data, error } = await supabase
      .from('pei_cycles')
      .insert({
        pei_id: params.peiId,
        cycle_number: params.cycleNumber,
        cycle_name: params.cycleName || `${params.cycleNumber}º Ciclo`,
        start_date: params.startDate,
        end_date: params.endDate,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as PEICycle;
  },

  /**
   * Atualiza um ciclo
   */
  async updateCycle(cycleId: string, updates: Partial<PEICycle>): Promise<PEICycle> {
    const { data, error } = await supabase
      .from('pei_cycles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cycleId)
      .select()
      .single();

    if (error) throw error;
    return data as PEICycle;
  },

  /**
   * Finaliza um ciclo e ativa o próximo
   */
  async completeCycle(cycleId: string): Promise<void> {
    const { error } = await supabase.rpc('complete_pei_cycle', {
      p_cycle_id: cycleId,
    });

    if (error) throw error;
  },

  /**
   * Busca metas de um ciclo específico
   */
  async getCycleGoals(cycleId: string): Promise<Array<{ id: string; description: string; progress_level: string }>> {
    const { data, error } = await supabase
      .from('pei_goals')
      .select('id, description, progress_level')
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Array<{ id: string; description: string; progress_level: string }>;
  },

  /**
   * Vincula uma meta a um ciclo
   */
  async linkGoalToCycle(goalId: string, cycleId: string): Promise<void> {
    const { error } = await supabase
      .from('pei_goals')
      .update({ cycle_id: cycleId })
      .eq('id', goalId);

    if (error) throw error;
  },
};

