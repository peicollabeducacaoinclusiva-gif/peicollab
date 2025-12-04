import { supabase } from '@pei/database';

export type ParticipationLevel = 'alta' | 'media' | 'baixa' | 'ausente';
export type SessionType = 'regular' | 'avaliacao' | 'reuniao';

export interface QuickSession {
  id: string;
  student_id: string;
  aee_id: string;
  date: string;
  notes?: string;
  tags?: string[];
  objective_id?: string;
  methodology_id?: string;
  student_participation?: ParticipationLevel;
  session_type: SessionType;
  quick_record: boolean;
  audio_transcription?: string;
  photo_urls?: string[];
  video_url?: string;
  recorded_at?: string;
  transcription_status?: 'pending' | 'processing' | 'completed' | 'failed';
  activities?: string[];
  progress?: string;
  resources?: string[];
  created_at: string;
}

export interface SessionParticipation {
  id: string;
  session_id: string;
  student_id: string;
  participation_level: ParticipationLevel;
  engagement_indicators?: Record<string, any>;
  observations?: string;
  created_at: string;
}

export interface PedagogicalTag {
  id: string;
  tenant_id?: string;
  tag_name: string;
  tag_category?: string;
  description?: string;
  color: string;
  usage_count: number;
  created_at: string;
}

export const quickSessionService = {
  /**
   * Cria registro rápido de sessão
   */
  async createQuickSession(
    studentId: string,
    aeeId: string,
    notes?: string,
    tags?: string[],
    objectiveId?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_quick_aee_session', {
      p_student_id: studentId,
      p_aee_id: aeeId,
      p_notes: notes || null,
      p_tags: tags || [],
      p_objective_id: objectiveId || null,
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Atualiza sessão com transcrição de áudio
   */
  async updateSessionWithTranscription(
    sessionId: string,
    transcription: string
  ): Promise<void> {
    const { error } = await supabase
      .from('aee_sessions')
      .update({
        audio_transcription: transcription,
        transcription_status: 'completed',
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  /**
   * Adiciona participação do aluno
   */
  async addParticipation(
    sessionId: string,
    studentId: string,
    participationLevel: ParticipationLevel,
    engagementIndicators?: Record<string, any>,
    observations?: string
  ): Promise<SessionParticipation> {
    const { data, error } = await supabase
      .from('aee_session_participation')
      .upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          participation_level: participationLevel,
          engagement_indicators: engagementIndicators || {},
          observations,
        },
        {
          onConflict: 'session_id,student_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as SessionParticipation;
  },

  /**
   * Busca tags pedagógicas
   */
  async getPedagogicalTags(tenantId?: string): Promise<PedagogicalTag[]> {
    let query = supabase
      .from('aee_pedagogical_tags')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('tag_name', { ascending: true });

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as PedagogicalTag[];
  },

  /**
   * Cria uma tag pedagógica
   */
  async createTag(tag: Partial<PedagogicalTag>): Promise<PedagogicalTag> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('aee_pedagogical_tags')
      .insert({
        ...tag,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PedagogicalTag;
  },

  /**
   * Busca sessões rápidas recentes
   */
  async getRecentQuickSessions(aeeId: string, limit: number = 10): Promise<QuickSession[]> {
    const { data, error } = await supabase
      .from('aee_sessions')
      .select('*')
      .eq('aee_id', aeeId)
      .eq('quick_record', true)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as QuickSession[];
  },
};

