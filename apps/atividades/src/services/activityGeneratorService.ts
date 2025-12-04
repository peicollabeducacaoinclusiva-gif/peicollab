import { supabase } from '@pei/database';

export interface ActivityBank {
  id: string;
  tenant_id?: string;
  activity_name: string;
  activity_description: string;
  stage: string;
  knowledge_area?: string;
  experience_field?: string;
  subject?: string;
  content: Record<string, any>;
  adaptations?: Array<Record<string, any>>;
  rubrics?: Array<Record<string, any>>;
  tags?: string[];
  pei_goal_categories?: string[];
  aee_objective_types?: string[];
  usage_count: number;
  rating: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  class_id: string;
  teacher_id: string;
  activity_bank_id?: string;
  title: string;
  description?: string;
  content: Record<string, any>;
  due_date?: string;
  pei_goal_id?: string;
  aee_objective_id?: string;
  adaptation_applied?: Record<string, any>;
  rubric_id?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ActivityResponse {
  id: string;
  activity_id: string;
  student_id: string;
  response_data: Record<string, any>;
  ai_feedback?: Record<string, any>;
  teacher_feedback?: string;
  score?: number;
  submitted_at?: string;
  graded_at?: string;
  graded_by?: string;
  created_at: string;
  updated_at: string;
}

export const activityGeneratorService = {
  /**
   * Gera atividade baseada em PEI/AEE
   */
  async generateFromPEIAEE(
    studentId: string,
    classId: string,
    teacherId: string,
    peiGoalId?: string,
    aeeObjectiveId?: string,
    baseActivityId?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('generate_activity_from_pei_aee', {
      p_student_id: studentId,
      p_class_id: classId,
      p_teacher_id: teacherId,
      p_pei_goal_id: peiGoalId || null,
      p_aee_objective_id: aeeObjectiveId || null,
      p_base_activity_id: baseActivityId || null,
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Busca atividades no banco
   */
  async searchActivityBank(
    stage?: string,
    knowledgeArea?: string,
    subject?: string,
    tags?: string[],
    tenantId?: string
  ): Promise<ActivityBank[]> {
    const { data, error } = await supabase.rpc('search_activity_bank', {
      p_stage: stage || null,
      p_knowledge_area: knowledgeArea || null,
      p_subject: subject || null,
      p_tags: tags || null,
      p_tenant_id: tenantId || null,
    });

    if (error) throw error;
    return (data || []) as ActivityBank[];
  },

  /**
   * Busca atividades criadas
   */
  async getActivities(
    classId?: string,
    teacherId?: string,
    status?: string
  ): Promise<Activity[]> {
    let query = supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Activity[];
  },

  /**
   * Cria uma atividade
   */
  async createActivity(activity: Partial<Activity>): Promise<Activity> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...activity,
        teacher_id: activity.teacher_id || user?.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  },

  /**
   * Atualiza uma atividade
   */
  async updateActivity(activityId: string, updates: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  },

  /**
   * Cria uma atividade no banco
   */
  async createActivityInBank(activity: Partial<ActivityBank>): Promise<ActivityBank> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('activity_bank')
      .insert({
        ...activity,
        created_by: user?.id,
        enabled: activity.enabled ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ActivityBank;
  },
};

