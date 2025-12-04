import { supabase } from '@pei/database';

export type DocumentType = 
  | 'declaracao_escolar'
  | 'historico_escolar'
  | 'certificado_conclusao'
  | 'diploma'
  | 'atestado_frequencia'
  | 'declaracao_transferencia'
  | 'declaracao_vinculo';

export type DocumentStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'issued';

export interface OfficialDocument {
  id: string;
  student_id: string;
  enrollment_id?: string;
  document_type: DocumentType;
  status: DocumentStatus;
  template_id?: string;
  content: any; // JSON com conteúdo do documento
  issued_at?: string;
  issued_by?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  digital_signature?: string;
  verification_code?: string;
  school_id: string;
  tenant_id: string;
  academic_year?: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  document_type: DocumentType;
  name: string;
  description?: string;
  template_content: any; // JSON com template
  is_official: boolean;
  requires_approval: boolean;
  school_id?: string;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const documentService = {
  async getDocuments(filters: {
    tenantId?: string;
    schoolId?: string;
    studentId?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    academicYear?: number;
  }): Promise<OfficialDocument[]> {
    let query = supabase
      .from('official_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.documentType) {
      query = query.eq('document_type', filters.documentType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.academicYear) {
      query = query.eq('academic_year', filters.academicYear);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createDocument(document: Partial<OfficialDocument>): Promise<OfficialDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('official_documents')
      .insert({
        ...document,
        status: document.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async generateDocument(
    studentId: string,
    documentType: DocumentType,
    templateId?: string,
    customData?: any
  ): Promise<OfficialDocument> {
    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, schools!inner(*)')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;
    if (!student) throw new Error('Aluno não encontrado');

    // Buscar template se fornecido
    let template: DocumentTemplate | null = null;
    if (templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!templateError && templateData) {
        template = templateData;
      }
    }

    // Gerar conteúdo do documento
    const content = this.generateDocumentContent(
      student,
      documentType,
      template,
      customData
    );

    // Criar documento
    const document = await this.createDocument({
      student_id: studentId,
      enrollment_id: customData?.enrollment_id,
      document_type: documentType,
      status: template?.requires_approval ? 'pending_approval' : 'draft',
      template_id: templateId,
      content,
      school_id: student.school_id,
      tenant_id: student.tenant_id,
      academic_year: customData?.academic_year || new Date().getFullYear(),
    });

    return document;
  },

  generateDocumentContent(
    student: any,
    documentType: DocumentType,
    template: DocumentTemplate | null,
    customData?: any
  ): any {
    const baseContent = {
      student_name: student.name,
      student_cpf: student.cpf,
      student_rg: student.rg,
      student_date_of_birth: student.date_of_birth,
      school_name: student.schools?.school_name,
      school_address: student.schools?.school_address,
      academic_year: customData?.academic_year || new Date().getFullYear(),
      issue_date: new Date().toLocaleDateString('pt-BR'),
    };

    switch (documentType) {
      case 'declaracao_escolar':
        return {
          ...baseContent,
          purpose: customData?.purpose || 'Declaração de vínculo escolar',
          period: customData?.period,
        };

      case 'historico_escolar':
        return {
          ...baseContent,
          grades: customData?.grades || [],
          attendance: customData?.attendance || [],
          periods: customData?.periods || [],
        };

      case 'certificado_conclusao':
        return {
          ...baseContent,
          completion_date: customData?.completion_date,
          course: customData?.course,
          grade_level: customData?.grade_level,
        };

      case 'diploma':
        return {
          ...baseContent,
          completion_date: customData?.completion_date,
          course: customData?.course,
          grade_level: customData?.grade_level,
          final_average: customData?.final_average,
        };

      case 'atestado_frequencia':
        return {
          ...baseContent,
          period: customData?.period,
          attendance_percentage: customData?.attendance_percentage,
          total_classes: customData?.total_classes,
          attended_classes: customData?.attended_classes,
        };

      case 'declaracao_transferencia':
        return {
          ...baseContent,
          destination_school: customData?.destination_school,
          transfer_date: customData?.transfer_date,
          reason: customData?.reason,
        };

      default:
        return baseContent;
    }
  },

  async approveDocument(documentId: string, approvedBy?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('official_documents')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy || user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) throw error;
  },

  async rejectDocument(documentId: string, reason: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('official_documents')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) throw error;
  },

  async issueDocument(documentId: string): Promise<{ verificationCode: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Gerar código de verificação
    const verificationCode = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const { error } = await supabase
      .from('official_documents')
      .update({
        status: 'issued',
        issued_at: new Date().toISOString(),
        issued_by: user.id,
        verification_code: verificationCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) throw error;

    return { verificationCode };
  },

  async exportToPDF(documentId: string): Promise<Blob> {
    // Em produção, isso chamaria uma função Edge ou serviço externo
    // Por enquanto, retorna um placeholder
    const document = await this.getDocument(documentId);
    if (!document) throw new Error('Documento não encontrado');

    // Simular geração de PDF
    // Em produção, usar jsPDF ou serviço de geração de PDF
    const pdfContent = JSON.stringify(document.content, null, 2);
    return new Blob([pdfContent], { type: 'application/pdf' });
  },

  async getDocument(documentId: string): Promise<OfficialDocument | null> {
    const { data, error } = await supabase
      .from('official_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getTemplates(tenantId: string, schoolId?: string): Promise<DocumentTemplate[]> {
    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (schoolId) {
      query = query.or(`school_id.is.null,school_id.eq.${schoolId}`);
    } else {
      query = query.is('school_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },
};








