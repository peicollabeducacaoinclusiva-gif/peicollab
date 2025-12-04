import { supabase } from '@pei/database';

export interface PlanningInsights {
  pei_goals: Array<{
    goal_id: string;
    description: string;
    category: string;
    progress_level: string;
    student_id: string;
    student_name: string;
  }>;
  aee_objectives: Array<{
    objective_id: string;
    title: string;
    description: string;
    objective_type: string;
    status: string;
    student_id: string;
    student_name: string;
  }>;
  adaptations: Array<{
    adaptation_type: string;
    description: string;
    student_id: string;
    student_name: string;
  }>;
  resources: Array<{
    resource_type: string;
    description: string;
    student_id: string;
  }>;
}

export interface PedagogicalPlanning {
  id: string;
  class_id: string;
  teacher_id: string;
  planning_type: 'daily' | 'weekly' | 'monthly' | 'bimonthly';
  start_date: string;
  end_date?: string;
  subject?: string;
  content: Record<string, any>;
  pei_insights?: Record<string, any>;
  aee_strategies?: Array<Record<string, any>>;
  adaptations?: Array<Record<string, any>>;
  resources?: Array<Record<string, any>>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface PlanningPEILink {
  id: string;
  planning_id: string;
  pei_goal_id?: string;
  pei_id?: string;
  link_type: 'goal' | 'adaptation' | 'resource' | 'strategy';
  description?: string;
  created_at: string;
}

export interface PlanningAEELink {
  id: string;
  planning_id: string;
  aee_objective_id?: string;
  aee_id?: string;
  link_type: 'objective' | 'methodology' | 'strategy' | 'activity';
  description?: string;
  created_at: string;
}

export const peiConnectionService = {
  /**
   * Busca insights PEI/AEE para uma turma
   */
  async getPlanningInsights(
    classId: string,
    date?: string
  ): Promise<PlanningInsights> {
    const { data, error } = await supabase.rpc('get_planning_insights', {
      p_class_id: classId,
      p_date: date || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    return data as PlanningInsights;
  },

  /**
   * Cria um planejamento pedagógico
   */
  async createPlanning(planning: Partial<PedagogicalPlanning>): Promise<PedagogicalPlanning> {
    const { data, error } = await supabase
      .from('pedagogical_plannings')
      .insert({
        ...planning,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PedagogicalPlanning;
  },

  /**
   * Vincula uma meta do PEI ao planejamento
   */
  async linkPEIGoal(
    planningId: string,
    peiGoalId: string,
    linkType: 'goal' | 'adaptation' | 'resource' | 'strategy',
    description?: string
  ): Promise<PlanningPEILink> {
    const { data, error } = await supabase
      .from('planning_pei_links')
      .insert({
        planning_id: planningId,
        pei_goal_id: peiGoalId,
        link_type: linkType,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PlanningPEILink;
  },

  /**
   * Vincula um objetivo do AEE ao planejamento
   */
  async linkAEEObjective(
    planningId: string,
    aeeObjectiveId: string,
    linkType: 'objective' | 'methodology' | 'strategy' | 'activity',
    description?: string
  ): Promise<PlanningAEELink> {
    const { data, error } = await supabase
      .from('planning_aee_links')
      .insert({
        planning_id: planningId,
        aee_objective_id: aeeObjectiveId,
        link_type: linkType,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PlanningAEELink;
  },

  /**
   * Busca planejamentos de uma turma
   */
  async getPlannings(
    classId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PedagogicalPlanning[]> {
    let query = supabase
      .from('pedagogical_plannings')
      .select('*')
      .eq('class_id', classId)
      .order('start_date', { ascending: false });

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as PedagogicalPlanning[];
  },
};
