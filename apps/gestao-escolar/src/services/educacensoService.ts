import { supabase } from '@pei/database';

export interface EducacensoValidationResult {
  valid: boolean;
  errors: Array<{
    type: 'error' | 'warning';
    table: string;
    record_id: string;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    type: 'error' | 'warning';
    table: string;
    record_id: string;
    field: string;
    message: string;
  }>;
  total_errors: number;
  total_warnings: number;
}

export interface EducacensoValidation {
  status: 'valid' | 'warning' | 'invalid';
  errors: Array<{ message: string }>;
  warnings: Array<{ message: string }>;
  summary: {
    total_students: number;
    valid_students: number;
    invalid_students: number;
  };
}

export interface EducacensoExport {
  id: string;
  tenant_id: string;
  school_id: string | null;
  academic_year: number;
  file_name: string;
  file_size: number;
  records_count: {
    escolas: number;
    turmas: number;
    alunos: number;
    profissionais: number;
    matriculas: number;
  };
  validation_errors: EducacensoValidationResult | null;
  exported_by: string;
  exported_at: string;
}

export const educacensoService = {
  /**
   * Valida dados antes de exportar para Educacenso
   */
  async validateData(
    tenantId: string,
    schoolId?: string,
    academicYear?: number
  ): Promise<EducacensoValidationResult> {
    const { data, error } = await supabase.rpc('validate_educacenso_data', {
      p_tenant_id: tenantId,
      p_school_id: schoolId || null,
      p_academic_year: academicYear || null,
    });

    if (error) throw error;
    return data as EducacensoValidationResult;
  },

  /**
   * Gera arquivo TXT no formato Educacenso
   */
  async generateFile(
    tenantId: string,
    schoolId?: string,
    academicYear?: number
  ): Promise<string> {
    const { data, error } = await supabase.rpc('generate_educacenso_file', {
      p_tenant_id: tenantId,
      p_school_id: schoolId || null,
      p_academic_year: academicYear || null,
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Faz download do arquivo gerado via Edge Function
   */
  async downloadFile(
    tenantId: string,
    schoolId: string | undefined,
    academicYear: number,
    fileName?: string
  ): Promise<void> {
    try {
      // Validar dados primeiro
      const validation = await this.validateData(tenantId, schoolId, academicYear);
      
      if (!validation.valid && validation.total_errors > 0) {
        throw new Error(
          `Não é possível exportar. Existem ${validation.total_errors} erro(s) de validação. ` +
          'Corrija os erros antes de exportar.'
        );
      }

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('educacenso-export', {
        body: {
          tenantId,
          schoolId: schoolId || null,
          academicYear: academicYear || null,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Se retornou texto (arquivo), fazer download
      if (typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `educacenso_${academicYear || new Date().getFullYear()}_${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Resposta inválida da função');
      }
    } catch (error: any) {
      console.error('Erro ao fazer download:', error);
      throw error;
    }
  },

  /**
   * Busca histórico de exportações
   */
  async getExportHistory(
    tenantId: string,
    schoolId?: string
  ): Promise<EducacensoExport[]> {
    let query = supabase
      .from('educacenso_exports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('exported_at', { ascending: false });

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as EducacensoExport[];
  },
};
