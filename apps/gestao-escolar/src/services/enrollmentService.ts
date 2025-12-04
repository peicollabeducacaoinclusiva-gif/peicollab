import { supabase } from '@pei/database';

export type EnrollmentRequestType = 'pre_matricula' | 'rematricula' | 'transferencia';
export type EnrollmentRequestStatus = 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'cancelada';
export type DocumentStatus = 'pending' | 'incomplete' | 'complete' | 'verified';

export interface EnrollmentRequest {
  id: string;
  student_id?: string;
  student_name?: string;
  school_id: string;
  school_name?: string;
  tenant_id: string;
  request_type: EnrollmentRequestType;
  status: EnrollmentRequestStatus;
  academic_year: number;
  requested_class_id?: string;
  requested_grade?: string;
  requested_class_name?: string;
  requested_shift?: string;
  requested_by_name?: string;
  requested_by_cpf?: string;
  requested_by_relationship?: string;
  rejection_reason?: string;
  rejection_details?: string;
  approved_at?: string;
  approved_by_name?: string;
  rejected_at?: string;
  rejected_by_name?: string;
  notes?: string;
  waitlist_position?: number;
  priority_score?: number;
  required_documents?: string[];
  submitted_documents?: string[];
  document_status?: DocumentStatus;
  analysis_notes?: string;
  analysis_by?: string;
  analysis_at?: string;
  matriculated_at?: string;
  matriculated_by?: string;
  enrollment_id?: string;
  transfer_from_school_id?: string;
  transfer_from_class_id?: string;
  transfer_reason?: string;
  rematriculation_confirmed?: boolean;
  rematriculation_confirmed_at?: string;
  rematriculation_confirmed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentDocument {
  id: string;
  enrollment_request_id: string;
  document_type: string;
  document_name: string;
  file_path?: string;
  file_url?: string;
  file_size_bytes?: number;
  uploaded_at: string;
  uploaded_by?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  created_at: string;
}

export interface WaitlistItem {
  id: string;
  enrollment_request_id: string;
  class_id: string;
  position: number;
  priority_score: number;
  added_at: string;
  notified_at?: string;
  removed_at?: string;
  removed_reason?: string;
}

export const enrollmentService = {
  async getEnrollmentRequests(filters: {
    tenantId?: string;
    schoolId?: string;
    status?: EnrollmentRequestStatus;
    type?: EnrollmentRequestType;
    academicYear?: number;
  }): Promise<EnrollmentRequest[]> {
    let query = supabase
      .from('enrollment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('request_type', filters.type);
    }

    if (filters.academicYear) {
      query = query.eq('academic_year', filters.academicYear);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getEnrollmentRequest(requestId: string): Promise<EnrollmentRequest | null> {
    const { data, error } = await supabase
      .from('enrollment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async moveToAnalysis(
    requestId: string,
    analysisNotes?: string,
    analystId?: string
  ): Promise<void> {
    const { data, error } = await supabase.rpc('move_enrollment_to_analysis', {
      p_request_id: requestId,
      p_analysis_notes: analysisNotes || null,
      p_analyst_id: analystId || null,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erro ao mover para análise');
    }
  },

  async approveEnrollment(
    requestId: string,
    classId: string,
    approvedBy?: string
  ): Promise<{ enrollmentId: string }> {
    const { data, error } = await supabase.rpc('approve_enrollment_request', {
      p_request_id: requestId,
      p_class_id: classId,
      p_approved_by: approvedBy || null,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erro ao aprovar matrícula');
    }

    return { enrollmentId: data.enrollment_id };
  },

  async rejectEnrollment(
    requestId: string,
    reason: string,
    details?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('enrollment_requests')
      .update({
        status: 'rejeitada',
        rejection_reason: reason,
        rejection_details: details,
        rejected_at: new Date().toISOString(),
        rejected_by_name: profile?.full_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) throw error;
  },

  async addToWaitlist(requestId: string, classId: string): Promise<{ position: number }> {
    const { data, error } = await supabase.rpc('add_to_waitlist', {
      p_request_id: requestId,
      p_class_id: classId,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erro ao adicionar à fila de espera');
    }

    return { position: data.position };
  },

  async getWaitlist(classId: string): Promise<WaitlistItem[]> {
    const { data, error } = await supabase
      .from('enrollment_waitlist')
      .select('*')
      .eq('class_id', classId)
      .is('removed_at', null)
      .order('priority_score', { ascending: false })
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async processWaitlist(classId: string): Promise<{ processed: number }> {
    const { data, error } = await supabase.rpc('process_waitlist_for_class', {
      p_class_id: classId,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erro ao processar fila de espera');
    }

    return { processed: data.processed };
  },

  async getEnrollmentDocuments(requestId: string): Promise<EnrollmentDocument[]> {
    const { data, error } = await supabase
      .from('enrollment_documents')
      .select('*')
      .eq('enrollment_request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async uploadDocument(
    requestId: string,
    documentType: string,
    documentName: string,
    fileUrl: string,
    fileSizeBytes?: number
  ): Promise<EnrollmentDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('enrollment_documents')
      .insert({
        enrollment_request_id: requestId,
        document_type: documentType,
        document_name: documentName,
        file_url: fileUrl,
        file_size_bytes: fileSizeBytes,
        uploaded_by: user.id,
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async verifyDocument(
    documentId: string,
    verified: boolean,
    verificationNotes?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {
      verified,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    };

    if (verificationNotes) {
      updateData.verification_notes = verificationNotes;
    }

    const { error } = await supabase
      .from('enrollment_documents')
      .update(updateData)
      .eq('id', documentId);

    if (error) throw error;
  },

  async confirmRematriculation(requestId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('enrollment_requests')
      .update({
        rematriculation_confirmed: true,
        rematriculation_confirmed_at: new Date().toISOString(),
        rematriculation_confirmed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) throw error;
  },
};








