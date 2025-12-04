import { supabase } from '@pei/database';

export type TimelineEventType = 'frequency' | 'activity' | 'evaluation' | 'aee_session' | 'pei_update' | 'message';

export interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  event_date: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  frequency: {
    total_days: number;
    present_days: number;
    absent_days: number;
  };
  activities: Array<{
    date: string;
    title: string;
    type: string;
  }>;
  evaluations: Array<{
    date: string;
    title: string;
    description?: string;
  }>;
  aee_sessions: Array<{
    date: string;
    title: string;
  }>;
}

export const timelineService = {
  /**
   * Busca timeline do aluno (respeitando privacidade)
   */
  async getStudentTimeline(
    studentId: string,
    familyMemberId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TimelineEvent[]> {
    const { data, error } = await supabase.rpc('get_student_timeline_for_family', {
      p_student_id: studentId,
      p_family_member_id: familyMemberId,
      p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    if (error) throw error;
    return (data || []) as TimelineEvent[];
  },

  /**
   * Busca resumo semanal
   */
  async getWeeklySummary(
    studentId: string,
    familyMemberId: string,
    weekStart: string
  ): Promise<WeeklySummary> {
    const { data, error } = await supabase.rpc('get_weekly_summary', {
      p_student_id: studentId,
      p_family_member_id: familyMemberId,
      p_week_start: weekStart,
    });

    if (error) throw error;
    return data as WeeklySummary;
  },
};

