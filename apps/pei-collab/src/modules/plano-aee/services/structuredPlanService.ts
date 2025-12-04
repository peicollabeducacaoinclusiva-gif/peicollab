import { supabase } from '@pei/database';

export type ObjectiveType = 'academic' | 'functional' | 'social' | 'communication';
export type TechnologyType = 'comunicacao' | 'mobilidade' | 'acesso_informacao' | 'outro';
export type UsageFrequency = 'diario' | 'semanal' | 'sob_demanda';

export interface AEEObjective {
  id: string;
  aee_id: string;
  pei_goal_id?: string;
  objective_type: ObjectiveType;
  title: string;
  description: string;
  target_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  progress_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AEEMethodology {
  id: string;
  aee_id: string;
  objective_id?: string;
  methodology_name: string;
  description: string;
  frequency?: string;
  duration_minutes?: number;
  resources_needed?: string[];
  implementation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AEEAssistiveTechnology {
  id: string;
  aee_id: string;
  technology_type: TechnologyType;
  technology_name: string;
  description?: string;
  usage_frequency?: UsageFrequency;
  provider?: string;
  training_required: boolean;
  training_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AEEWeeklyPlan {
  id: string;
  aee_id: string;
  week_start_date: string;
  week_end_date: string;
  monday_objectives?: string[];
  tuesday_objectives?: string[];
  wednesday_objectives?: string[];
  thursday_objectives?: string[];
  friday_objectives?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StructuredAEEPlan {
  aee_id: string;
  objectives: AEEObjective[];
  methodologies: AEEMethodology[];
  assistive_technologies: AEEAssistiveTechnology[];
  weekly_plans: AEEWeeklyPlan[];
}

export const structuredPlanService = {
  /**
   * Busca plano AEE estruturado completo
   */
  async getStructuredPlan(aeeId: string): Promise<StructuredAEEPlan> {
    const { data, error } = await supabase.rpc('get_structured_aee_plan', {
      p_aee_id: aeeId,
    });

    if (error) throw error;
    return data as StructuredAEEPlan;
  },

  /**
   * Cria um objetivo do AEE
   */
  async createObjective(objective: Partial<AEEObjective>): Promise<AEEObjective> {
    const { data, error } = await supabase
      .from('aee_objectives')
      .insert({
        ...objective,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as AEEObjective;
  },

  /**
   * Atualiza um objetivo
   */
  async updateObjective(objectiveId: string, updates: Partial<AEEObjective>): Promise<AEEObjective> {
    const { data, error } = await supabase
      .from('aee_objectives')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', objectiveId)
      .select()
      .single();

    if (error) throw error;
    return data as AEEObjective;
  },

  /**
   * Cria uma metodologia
   */
  async createMethodology(methodology: Partial<AEEMethodology>): Promise<AEEMethodology> {
    const { data, error } = await supabase
      .from('aee_methodologies')
      .insert({
        ...methodology,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as AEEMethodology;
  },

  /**
   * Cria uma tecnologia assistiva
   */
  async createAssistiveTechnology(technology: Partial<AEEAssistiveTechnology>): Promise<AEEAssistiveTechnology> {
    const { data, error } = await supabase
      .from('aee_assistive_technologies')
      .insert({
        ...technology,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as AEEAssistiveTechnology;
  },

  /**
   * Cria ou atualiza plano semanal
   */
  async upsertWeeklyPlan(plan: Partial<AEEWeeklyPlan>): Promise<AEEWeeklyPlan> {
    const { data, error } = await supabase
      .from('aee_weekly_plan')
      .upsert(
        {
          ...plan,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'aee_id,week_start_date',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as AEEWeeklyPlan;
  },

  /**
   * Busca objetivos vinculados a metas do PEI
   */
  async getObjectivesByPEIGoal(peiGoalId: string): Promise<AEEObjective[]> {
    const { data, error } = await supabase
      .from('aee_objectives')
      .select('*')
      .eq('pei_goal_id', peiGoalId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as AEEObjective[];
  },
};


