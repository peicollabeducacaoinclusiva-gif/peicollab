import { supabase } from '@pei/database';

export interface PrivacySettings {
  id: string;
  student_id: string;
  family_member_id: string;
  show_diagnosis: boolean;
  show_medical_info: boolean;
  show_full_pei: boolean;
  show_aee_details: boolean;
  show_evaluations: boolean;
  show_frequency: boolean;
  show_behavioral_notes: boolean;
  notification_preferences: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export const privacySettingsService = {
  /**
   * Busca configurações de privacidade
   */
  async getPrivacySettings(
    studentId: string,
    familyMemberId: string
  ): Promise<PrivacySettings | null> {
    const { data, error } = await supabase
      .from('family_privacy_settings')
      .select('*')
      .eq('student_id', studentId)
      .eq('family_member_id', familyMemberId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data as PrivacySettings | null;
  },

  /**
   * Atualiza configurações de privacidade
   */
  async updatePrivacySettings(
    studentId: string,
    familyMemberId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    const { data, error } = await supabase
      .from('family_privacy_settings')
      .upsert(
        {
          student_id: studentId,
          family_member_id: familyMemberId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'student_id,family_member_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as PrivacySettings;
  },
};

