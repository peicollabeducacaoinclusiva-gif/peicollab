import { supabase } from '@pei/database';

export interface DiaryLink {
  id: string;
  activity_id: string;
  diary_entry_id?: string;
  evaluation_id?: string;
  created_at: string;
}

export const diaryIntegrationService = {
  /**
   * Vincula atividade a uma entrada do diário
   */
  async linkToDiary(
    activityId: string,
    evaluationId?: string,
    diaryEntryId?: string
  ): Promise<DiaryLink> {
    const { data, error } = await supabase
      .from('activity_diary_links')
      .insert({
        activity_id: activityId,
        evaluation_id: evaluationId,
        diary_entry_id: diaryEntryId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DiaryLink;
  },

  /**
   * Busca vínculos de uma atividade
   */
  async getActivityLinks(activityId: string): Promise<DiaryLink[]> {
    const { data, error } = await supabase
      .from('activity_diary_links')
      .select('*')
      .eq('activity_id', activityId);

    if (error) throw error;
    return (data || []) as DiaryLink[];
  },

  /**
   * Cria avaliação a partir de atividade
   */
  async createEvaluationFromActivity(
    activityId: string,
    classId: string,
    subjectId: string,
    title: string,
    date: string
  ): Promise<string> {
    // Buscar dados da atividade
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (activityError) throw activityError;

    // Criar avaliação usando serviço universal
    const { data, error } = await supabase.rpc('create_universal_evaluation', {
      p_class_id: classId,
      p_subject_id: subjectId,
      p_evaluation_type_name: 'formativa',
      p_title: title,
      p_date: date,
      p_evaluation_data: {
        activity_id: activityId,
        activity_title: activity.title,
        content: activity.content,
      },
    });

    if (error) throw error;

    // Vincular atividade à avaliação
    await this.linkToDiary(activityId, data);

    return data as string;
  },

  /**
   * Busca atividades vinculadas a uma avaliação
   */
  async getActivitiesByEvaluation(evaluationId: string): Promise<Array<{
    activity_id: string;
    activity_title: string;
    activity_status: string;
  }>> {
    const { data, error } = await supabase
      .from('activity_diary_links')
      .select(`
        activity_id,
        activities!inner(id, title, status)
      `)
      .eq('evaluation_id', evaluationId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      activity_id: item.activity_id,
      activity_title: item.activities?.title || '',
      activity_status: item.activities?.status || '',
    }));
  },
};

