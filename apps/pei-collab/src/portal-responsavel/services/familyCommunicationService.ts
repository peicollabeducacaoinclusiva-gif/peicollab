import { supabase } from '@pei/database';

export type ObservationType = 'general' | 'pei' | 'aee' | 'behavior' | 'health' | 'homework';
export type ObservationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageType = 'school_message' | 'pei_notification' | 'aee_notification' | 'evaluation';

export interface FamilyObservation {
  id: string;
  student_id: string;
  family_member_id: string;
  observation_type: ObservationType;
  title?: string;
  observation_text: string;
  priority: ObservationPriority;
  read_by_school: boolean;
  read_by_school_at?: string;
  read_by_school_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageReadConfirmation {
  id: string;
  message_id: string;
  message_type: MessageType;
  family_member_id: string;
  read_at: string;
  confirmed_at?: string;
}

export const familyCommunicationService = {
  /**
   * Cria uma observação da família
   */
  async createObservation(
    studentId: string,
    observationType: ObservationType,
    observationText: string,
    title?: string,
    priority: ObservationPriority = 'normal'
  ): Promise<FamilyObservation> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('family_observations')
      .insert({
        student_id: studentId,
        family_member_id: user.id,
        observation_type: observationType,
        title,
        observation_text: observationText,
        priority,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FamilyObservation;
  },

  /**
   * Busca observações da família
   */
  async getObservations(
    studentId: string,
    familyMemberId?: string
  ): Promise<FamilyObservation[]> {
    let query = supabase
      .from('family_observations')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (familyMemberId) {
      query = query.eq('family_member_id', familyMemberId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as FamilyObservation[];
  },

  /**
   * Confirma leitura de mensagem
   */
  async confirmMessageRead(
    messageId: string,
    messageType: MessageType
  ): Promise<MessageReadConfirmation> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('message_read_confirmations')
      .upsert(
        {
          message_id: messageId,
          message_type: messageType,
          family_member_id: user.id,
          read_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        },
        {
          onConflict: 'message_id,message_type,family_member_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as MessageReadConfirmation;
  },

  /**
   * Busca confirmações de leitura
   */
  async getReadConfirmations(
    messageId: string,
    messageType: MessageType
  ): Promise<MessageReadConfirmation[]> {
    const { data, error } = await supabase
      .from('message_read_confirmations')
      .select('*')
      .eq('message_id', messageId)
      .eq('message_type', messageType);

    if (error) throw error;
    return (data || []) as MessageReadConfirmation[];
  },
};

