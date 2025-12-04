import { supabase } from '@pei/database';

export type NotificationType = 'diary_entry' | 'grade' | 'attendance' | 'report' | 'occurrence';

export interface DiaryNotification {
  id: string;
  tenant_id: string;
  school_id?: string;
  student_id: string;
  enrollment_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  diary_entry_id?: string;
  grade_id?: string;
  attendance_id?: string;
  report_id?: string;
  occurrence_id?: string;
  sent_to: string[]; // IDs dos responsáveis
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PublicAccessLink {
  id: string;
  enrollment_id: string;
  access_token: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
}

export const diaryNotificationService = {
  async createNotification(notification: Partial<DiaryNotification>): Promise<DiaryNotification> {
    const { data, error } = await supabase
      .from('diary_notifications')
      .insert({
        tenant_id: notification.tenant_id,
        school_id: notification.school_id,
        student_id: notification.student_id,
        enrollment_id: notification.enrollment_id,
        notification_type: notification.notification_type,
        title: notification.title,
        message: notification.message,
        diary_entry_id: notification.diary_entry_id,
        grade_id: notification.grade_id,
        attendance_id: notification.attendance_id,
        report_id: notification.report_id,
        occurrence_id: notification.occurrence_id,
        sent_to: notification.sent_to || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async sendNotificationToGuardians(
    enrollmentId: string,
    notificationType: NotificationType,
    title: string,
    message: string,
    relatedId?: string,
    createdBy?: string
  ): Promise<void> {
    // Buscar responsáveis do aluno
    const { data: enrollment } = await supabase
      .from('student_enrollments')
      .select(`
        student_id,
        tenant_id,
        school_id,
        students:student_id(
          guardians:student_guardians(guardian_id, profiles:guardian_id(id, email, full_name))
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) return;

    const guardians = (enrollment.students as any)?.guardians || [];
    const guardianIds = guardians
      .map((g: any) => g.profiles?.id)
      .filter(Boolean);

    if (guardianIds.length === 0) return;

    // Criar notificação
    const notificationData: Partial<DiaryNotification> = {
      tenant_id: (enrollment as any).tenant_id,
      school_id: (enrollment as any).school_id,
      student_id: (enrollment as any).student_id,
      enrollment_id: enrollmentId,
      notification_type: notificationType,
      title,
      message,
      sent_to: guardianIds,
    };

    // Adicionar ID relacionado baseado no tipo
    switch (notificationType) {
      case 'diary_entry':
        notificationData.diary_entry_id = relatedId;
        break;
      case 'grade':
        notificationData.grade_id = relatedId;
        break;
      case 'attendance':
        notificationData.attendance_id = relatedId;
        break;
      case 'report':
        notificationData.report_id = relatedId;
        break;
      case 'occurrence':
        notificationData.occurrence_id = relatedId;
        break;
    }

    const notification = await this.createNotification(notificationData);

    // Criar mensagem no sistema de comunicação
    try {
      // Verificar se a tabela messages existe tentando uma query simples
      const { error: checkError } = await supabase
        .from('messages')
        .select('id')
        .limit(0);

      // Se não houver erro, a tabela existe
      if (!checkError) {
        for (const guardianId of guardianIds) {
          await supabase
            .from('messages')
            .insert({
              sender_id: createdBy || null,
              receiver_id: guardianId,
              subject: title,
              content: message,
              message_type: 'diary_notification',
              related_id: notification.id,
              is_read: false,
            })
            .catch((err) => {
              // Ignorar erro se houver problema ao criar mensagem
              console.warn('Erro ao criar mensagem:', err);
            });
        }
      }
    } catch (error) {
      // Ignorar erro se sistema de mensagens não estiver disponível
      console.warn('Sistema de mensagens não disponível:', error);
    }

    // Enviar emails (se configurado)
    for (const guardian of guardians) {
      if (guardian.profiles?.email) {
        // TODO: Integrar com serviço de email
        console.log(`Enviando email para ${guardian.profiles.email}: ${title}`);
      }
    }
  },

  async createPublicAccessLink(
    enrollmentId: string,
    createdBy: string,
    expiresInDays?: number
  ): Promise<PublicAccessLink> {
    // Gerar token único
    const accessToken = crypto.randomUUID() + '-' + Date.now().toString(36);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('diary_public_access_links')
      .insert({
        enrollment_id: enrollmentId,
        access_token: accessToken,
        expires_at: expiresAt,
        is_active: true,
        created_by: createdBy,
        access_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PublicAccessLink;
  },

  async validatePublicAccessLink(token: string): Promise<PublicAccessLink | null> {
    const { data, error } = await supabase
      .from('diary_public_access_links')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Verificar expiração
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Desativar link expirado
      await supabase
        .from('diary_public_access_links')
        .update({ is_active: false })
        .eq('id', data.id);
      return null;
    }

    // Atualizar contador de acesso
    await supabase
      .from('diary_public_access_links')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (data.access_count || 0) + 1,
      })
      .eq('id', data.id);

    return data as PublicAccessLink;
  },

  async getPublicAccessLinks(enrollmentId: string): Promise<PublicAccessLink[]> {
    const { data, error } = await supabase
      .from('diary_public_access_links')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PublicAccessLink[];
  },

  async revokePublicAccessLink(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('diary_public_access_links')
      .update({ is_active: false })
      .eq('id', linkId);

    if (error) throw error;
  },
};

