import { supabase } from '@/integrations/supabase/client';

export interface AEEProgress {
  goal_id: string;
  goal_description: string;
  aee_sessions: Array<{
    date: string;
    notes: string;
    activities: string[];
    progress: string;
  }>;
  total_sessions: number;
  last_session_date?: string;
  overall_progress: string;
}

export interface AEEActivity {
  id: string;
  activity_type: string;
  description: string;
  date: string;
  resources?: string[];
  linked_goal_id?: string;
}

export const aeeIntegrationService = {
  /**
   * Busca progresso do AEE vinculado a metas do PEI
   */
  async getAEEProgress(peiId: string): Promise<AEEProgress[]> {
    // Buscar PEI
    const { data: pei, error: peiError } = await supabase
      .from('peis')
      .select('student_id')
      .eq('id', peiId)
      .single();

    if (peiError || !pei) throw new Error('PEI não encontrado');

    // Buscar metas do PEI
    const { data: goals, error: goalsError } = await supabase
      .from('pei_goals')
      .select('id, description')
      .eq('pei_id', peiId);

    if (goalsError) throw goalsError;

    const progress: AEEProgress[] = [];

    for (const goal of goals || []) {
      // Buscar atividades AEE vinculadas a esta meta
      const { data: linkedActivities } = await supabase
        .from('aee_activity_pei_goals')
        .select('aee_activity_id')
        .eq('pei_goal_id', goal.id);

      if (linkedActivities && linkedActivities.length > 0) {
        const activityIds = linkedActivities.map((a) => a.aee_activity_id);

        // Buscar sessões AEE
        const { data: sessions } = await supabase
          .from('aee_sessions')
          .select('date, notes, activities, progress')
          .eq('student_id', pei.student_id)
          .in('id', activityIds)
          .order('date', { ascending: false });

        const aeeSessions = (sessions || []).map((s) => ({
          date: s.date,
          notes: s.notes || '',
          activities: s.activities || [],
          progress: s.progress || '',
        }));

        // Calcular progresso geral
        const progressLevels = aeeSessions.map((s) => s.progress).filter(Boolean);
        const overallProgress =
          progressLevels.length > 0
            ? progressLevels[progressLevels.length - 1]
            : 'não iniciada';

        progress.push({
          goal_id: goal.id,
          goal_description: goal.description,
          aee_sessions: aeeSessions,
          total_sessions: aeeSessions.length,
          last_session_date: aeeSessions[0]?.date,
          overall_progress: overallProgress,
        });
      } else {
        // Meta sem atividades AEE vinculadas
        progress.push({
          goal_id: goal.id,
          goal_description: goal.description,
          aee_sessions: [],
          total_sessions: 0,
          overall_progress: 'sem atividades',
        });
      }
    }

    return progress;
  },

  /**
   * Busca atividades AEE disponíveis para vinculação
   */
  async getAvailableActivities(studentId: string): Promise<AEEActivity[]> {
    const { data: activities, error } = await supabase
      .from('aee_sessions')
      .select('id, activity_type, description, date, resources')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw error;

    return (activities || []).map((a) => ({
      id: a.id,
      activity_type: a.activity_type || '',
      description: a.description || '',
      date: a.date,
      resources: a.resources || [],
    })) as AEEActivity[];
  },
};

