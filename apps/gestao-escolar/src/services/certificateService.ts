import { supabase } from '@pei/database';

export interface Certificate {
  id: string;
  student_id: string;
  enrollment_id: string;
  certificate_type: 'completion' | 'diploma' | 'school_history' | 'declaration';
  academic_year: number;
  issue_date: string;
  certificate_number: string;
  pdf_url: string | null;
  template_id: string | null;
  custom_data: Record<string, any>;
  issued_by: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateTemplate {
  id: string;
  tenant_id: string;
  school_id: string | null;
  template_name: string;
  certificate_type: 'completion' | 'diploma' | 'school_history' | 'declaration';
  template_content: string; // HTML ou Markdown
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const certificateService = {
  async getCertificates(filters: {
    tenantId: string;
    studentId?: string;
    certificateType?: string;
    academicYear?: number;
  }) {
    let query = supabase
      .from('certificates')
      .select(`
        *,
        students:student_id(name, date_of_birth, registration_number),
        enrollments:enrollment_id(grade, shift, class_name),
        issued_by_profile:issued_by(full_name)
      `)
      .eq('tenant_id', filters.tenantId);

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.certificateType) {
      query = query.eq('certificate_type', filters.certificateType);
    }

    if (filters.academicYear) {
      query = query.eq('academic_year', filters.academicYear);
    }

    const { data, error } = await query.order('issue_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCertificateById(certificateId: string) {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        students:student_id(*),
        enrollments:enrollment_id(*),
        issued_by_profile:issued_by(full_name)
      `)
      .eq('id', certificateId)
      .single();

    if (error) throw error;
    return data;
  },

  async createCertificate(certificate: Partial<Certificate> & { tenant_id?: string }) {
    // Gerar número do certificado
    const certificateNumber = await this.generateCertificateNumber(
      certificate.tenant_id || '',
      certificate.certificate_type || 'completion'
    );

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        student_id: certificate.student_id,
        enrollment_id: certificate.enrollment_id,
        certificate_type: certificate.certificate_type || 'completion',
        academic_year: certificate.academic_year || new Date().getFullYear(),
        issue_date: certificate.issue_date || new Date().toISOString().split('T')[0],
        certificate_number: certificateNumber,
        template_id: certificate.template_id,
        custom_data: certificate.custom_data || {},
        issued_by: certificate.issued_by,
        tenant_id: certificate.tenant_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async generateCertificateNumber(tenantId: string, type: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === 'completion' ? 'CERT' : type === 'diploma' ? 'DIP' : 'DEC';
    
    // Buscar último número do ano
    const { data, error } = await supabase
      .from('certificates')
      .select('certificate_number')
      .eq('tenant_id', tenantId)
      .eq('certificate_type', type)
      .like('certificate_number', `${prefix}-${year}-%`)
      .order('certificate_number', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') throw error;

    let nextNumber = 1;
    if (data && data.length > 0 && data[0]) {
      const lastNumber = data[0].certificate_number.split('-')[2];
      nextNumber = parseInt(lastNumber) + 1;
    }

    return `${prefix}-${year}-${nextNumber.toString().padStart(6, '0')}`;
  },

  async getTemplates(tenantId: string, schoolId?: string, certificateType?: string) {
    let query = supabase
      .from('certificate_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (schoolId) {
      query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
    } else {
      query = query.is('school_id', null);
    }

    if (certificateType) {
      query = query.eq('certificate_type', certificateType);
    }

    const { data, error } = await query.order('template_name');

    if (error) throw error;
    return data || [];
  },

  async createTemplate(template: Partial<CertificateTemplate>) {
    const { data, error } = await supabase
      .from('certificate_templates')
      .insert({
        tenant_id: template.tenant_id,
        school_id: template.school_id,
        template_name: template.template_name,
        certificate_type: template.certificate_type || 'completion',
        template_content: template.template_content || '',
        is_active: template.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(templateId: string, updates: Partial<CertificateTemplate>) {
    const { data, error } = await supabase
      .from('certificate_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async generatePDF(_certificateId: string): Promise<string> {
    // TODO: Implementar geração de PDF usando uma biblioteca como jsPDF ou react-pdf
    // Por enquanto, retorna uma URL vazia
    // Em produção, isso deveria chamar uma função Edge do Supabase ou um serviço externo
    return '';
  },
};

