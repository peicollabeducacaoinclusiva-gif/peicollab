import { supabase } from '@pei/database';
import type {
  RiskIndicator,
  RiskIndicators,
  Suggestion,
  StudentSuggestions,
  ActivityTimelineItem,
  ActivityTimeline,
  CompleteStudentProfile,
} from './superfichaTypes';

// Re-exportar tipos para manter compatibilidade
export type {
  RiskIndicator,
  RiskIndicators,
  Suggestion,
  StudentSuggestions,
  ActivityTimelineItem,
  ActivityTimeline,
  CompleteStudentProfile,
} from './superfichaTypes';

/**
 * Serviço centralizado para operações da Superficha
 */
export const superfichaService = {
  /**
   * Busca perfil completo do estudante (todos os dados em uma query)
   */
  async getCompleteProfile(studentId: string): Promise<CompleteStudentProfile> {
    const { data, error } = await supabase.rpc('get_student_complete_profile', {
      p_student_id: studentId,
    });

    if (error) throw error;
    return data as CompleteStudentProfile;
  },

  /**
   * Busca indicadores de risco do estudante
   */
  async getRiskIndicators(studentId: string): Promise<RiskIndicators> {
    const { data, error } = await supabase.rpc('get_student_risk_indicators', {
      p_student_id: studentId,
    });

    if (error) throw error;
    return data as RiskIndicators;
  },

  /**
   * Busca sugestões pedagógicas para o estudante
   */
  async getSuggestions(studentId: string): Promise<StudentSuggestions> {
    const { data, error } = await supabase.rpc('get_student_suggestions', {
      p_student_id: studentId,
    });

    if (error) throw error;
    return data as StudentSuggestions;
  },

  /**
   * Atualiza um campo específico do estudante (edição incremental)
   */
  async updateField(
    studentId: string,
    fieldName: string,
    fieldValue: string
  ): Promise<{ success: boolean; student_id: string; field: string; value: string; updated_at: string }> {
    const { data, error } = await supabase.rpc('update_student_field', {
      p_student_id: studentId,
      p_field_name: fieldName,
      p_field_value: fieldValue,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Busca timeline completa de atividades do estudante
   */
  async getActivityTimeline(
    studentId: string,
    limit: number = 50
  ): Promise<ActivityTimelineItem[]> {
    const { data, error } = await supabase.rpc('get_student_activity_timeline', {
      p_student_id: studentId,
      p_limit: limit,
    });

    if (error) throw error;
    return (data || []) as ActivityTimelineItem[];
  },

  /**
   * Busca todos os dados da Superficha de uma vez (otimizado)
   */
  async getAllSuperfichaData(studentId: string) {
    const [profile, risks, suggestions, timeline] = await Promise.all([
      this.getCompleteProfile(studentId),
      this.getRiskIndicators(studentId).catch(() => null),
      this.getSuggestions(studentId).catch(() => null),
      this.getActivityTimeline(studentId, 20).catch(() => []),
    ]);

    return {
      profile,
      risks,
      suggestions,
      timeline,
    };
  },
};

