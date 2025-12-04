import { supabase } from '@pei/database';

export interface SimplifiedPEI {
  pei_id: string;
  student_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  goals: Array<{
    id: string;
    description: string;
    category: string;
    progress_level?: string;
    target_date?: string;
  }>;
  adaptations: Array<{
    type: string;
    description: string;
  }>;
  resources: Array<{
    type: string;
    description: string;
  }>;
  diagnosis?: Record<string, any>;
}

export const simplifiedPEIService = {
  /**
   * Busca PEI simplificado (respeitando privacidade)
   */
  async getSimplifiedPEI(
    studentId: string,
    familyMemberId: string
  ): Promise<SimplifiedPEI | null> {
    const { data, error } = await supabase.rpc('get_simplified_pei_for_family', {
      p_student_id: studentId,
      p_family_member_id: familyMemberId,
    });

    if (error) throw error;
    return data as SimplifiedPEI | null;
  },
};

