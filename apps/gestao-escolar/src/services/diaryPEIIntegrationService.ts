import { supabase } from '@pei/database';

export type LinkType = 'suggested' | 'confirmed' | 'rejected';
export type AlertType = 'activity_related' | 'progress_update' | 'goal_achievement';
export type AlertPriority = 'low' | 'medium' | 'high';

export interface DiaryPEILink {
  id: string;
  evaluation_id?: string;
  activity_id?: string;
  pei_goal_id: string;
  link_type: LinkType;
  confidence_score: number;
  suggested_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PEIRelationSuggestion {
  pei_goal_id: string;
  goal_description: string;
  confidence_score: number;
  reason: string;
}

export interface PEIRelationAlert {
  id: string;
  student_id: string;
  pei_goal_id?: string;
  evaluation_id?: string;
  alert_type: AlertType;
  message: string;
  priority: AlertPriority;
  read: boolean;
  created_at: string;
}

export const diaryPEIIntegrationService = {
  /**
   * Sugere relações entre avaliação e metas do PEI
   */
  async suggestPEIRelations(
    evaluationId: string,
    studentId?: string
  ): Promise<PEIRelationSuggestion[]> {
    const { data, error } = await supabase.rpc('suggest_pei_relations', {
      p_evaluation_id: evaluationId,
      p_student_id: studentId || null,
    });

    if (error) throw error;
    return (data || []) as PEIRelationSuggestion[];
  },

  /**
   * Cria ou atualiza vínculo entre avaliação e meta PEI
   */
  async linkToPEIGoal(
    evaluationId: string,
    peiGoalId: string,
    linkType: LinkType,
    notes?: string,
    confidenceScore?: number
  ): Promise<DiaryPEILink> {
    const { data, error } = await supabase
      .from('diary_pei_links')
      .upsert(
        {
          evaluation_id: evaluationId,
          pei_goal_id: peiGoalId,
          link_type: linkType,
          confidence_score: confidenceScore || 0.5,
          suggested_by: 'teacher',
          notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'evaluation_id,pei_goal_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as DiaryPEILink;
  },

  /**
   * Busca vínculos de uma avaliação
   */
  async getEvaluationLinks(evaluationId: string): Promise<DiaryPEILink[]> {
    const { data, error } = await supabase
      .from('diary_pei_links')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .order('confidence_score', { ascending: false });

    if (error) throw error;
    return (data || []) as DiaryPEILink[];
  },

  /**
   * Busca alertas de relação PEI
   */
  async getPEIRelationAlerts(
    studentId?: string,
    read?: boolean
  ): Promise<PEIRelationAlert[]> {
    let query = supabase
      .from('pei_relation_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (read !== undefined) {
      query = query.eq('read', read);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as PEIRelationAlert[];
  },

  /**
   * Marca alerta como lido
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('pei_relation_alerts')
      .update({ read: true })
      .eq('id', alertId);

    if (error) throw error;
  },

  /**
   * Busca avaliações relacionadas a uma meta do PEI
   */
  async getEvaluationsByPEIGoal(peiGoalId: string): Promise<Array<{
    evaluation_id: string;
    evaluation_title: string;
    evaluation_date: string;
    link_type: LinkType;
  }>> {
    const { data, error } = await supabase
      .from('diary_pei_links')
      .select(`
        evaluation_id,
        link_type,
        evaluations!inner(id, title, date)
      `)
      .eq('pei_goal_id', peiGoalId)
      .eq('link_type', 'confirmed');

    if (error) throw error;

    return (data || []).map((item: any) => ({
      evaluation_id: item.evaluation_id,
      evaluation_title: item.evaluations?.title || '',
      evaluation_date: item.evaluations?.date || '',
      link_type: item.link_type,
    }));
  },
};
