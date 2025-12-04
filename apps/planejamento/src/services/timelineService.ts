import { supabase } from '@pei/database';

export type TimelineEventType = 'activity' | 'evaluation' | 'event' | 'attendance' | 'pei_update' | 'aee_session';

export interface TimelineEvent {
  id: string;
  class_id: string;
  event_type: TimelineEventType;
  event_date: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export const timelineService = {
  /**
   * Busca eventos da timeline de uma turma
   */
  async getClassTimeline(
    classId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TimelineEvent[]> {
    const { data, error } = await supabase.rpc('get_class_timeline', {
      p_class_id: classId,
      p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    if (error) throw error;
    return (data || []) as TimelineEvent[];
  },

  /**
   * Cria um evento na timeline
   */
  async createEvent(event: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('class_timeline_events')
      .insert({
        ...event,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TimelineEvent;
  },

  /**
   * Atualiza um evento
   */
  async updateEvent(eventId: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const { data, error } = await supabase
      .from('class_timeline_events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data as TimelineEvent;
  },

  /**
   * Remove um evento
   */
  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('class_timeline_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  },
};

