import { supabase } from '@pei/database';

export type ExportType = 'sed' | 'seduc' | 'inep' | 'municipal';

export interface ExportConfiguration {
  id: string;
  tenant_id?: string;
  export_type: ExportType;
  configuration_name: string;
  config_data: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficialExport {
  id: string;
  tenant_id?: string;
  school_id?: string;
  export_type: ExportType;
  export_period: {
    start_date: string;
    end_date: string;
    academic_year: number;
  };
  data_scope: {
    classes?: string[];
    students?: string[];
    evaluations?: boolean;
    frequency?: boolean;
    pei?: boolean;
    aee?: boolean;
  };
  file_url?: string;
  file_size?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  generated_by?: string;
  generated_at: string;
  completed_at?: string;
}

export interface ExportRequest {
  exportType: ExportType;
  tenantId: string;
  schoolId?: string;
  period: {
    startDate: string;
    endDate: string;
    academicYear: number;
  };
  dataScope: {
    classes?: string[];
    students?: string[];
    evaluations?: boolean;
    frequency?: boolean;
    pei?: boolean;
    aee?: boolean;
  };
}

export const officialExportsService = {
  /**
   * Busca configurações de exportação
   */
  async getExportConfigurations(
    exportType?: ExportType,
    tenantId?: string
  ): Promise<ExportConfiguration[]> {
    let query = supabase
      .from('export_configurations')
      .select('*')
      .eq('enabled', true)
      .order('configuration_name', { ascending: true });

    if (exportType) {
      query = query.eq('export_type', exportType);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as ExportConfiguration[];
  },

  /**
   * Cria ou atualiza configuração de exportação
   */
  async upsertExportConfiguration(
    config: Partial<ExportConfiguration>
  ): Promise<ExportConfiguration> {
    const { data, error } = await supabase
      .from('export_configurations')
      .upsert(
        {
          ...config,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'tenant_id,export_type,configuration_name',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as ExportConfiguration;
  },

  /**
   * Gera exportação oficial
   */
  async generateExport(request: ExportRequest): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc('generate_official_export', {
      p_export_type: request.exportType,
      p_tenant_id: request.tenantId,
      p_school_id: request.schoolId || null,
      p_period: {
        start_date: request.period.startDate,
        end_date: request.period.endDate,
        academic_year: request.period.academicYear,
      },
      p_data_scope: request.dataScope,
    });

    if (error) throw error;

    // Atualizar com usuário que gerou
    await supabase
      .from('official_exports')
      .update({ generated_by: user?.id })
      .eq('id', data);

    return data as string;
  },

  /**
   * Busca exportações realizadas
   */
  async getExports(
    tenantId?: string,
    schoolId?: string,
    exportType?: ExportType,
    status?: string
  ): Promise<OfficialExport[]> {
    let query = supabase
      .from('official_exports')
      .select('*')
      .order('generated_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    if (exportType) {
      query = query.eq('export_type', exportType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as OfficialExport[];
  },

  /**
   * Atualiza status de exportação
   */
  async updateExportStatus(
    exportId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    fileUrl?: string,
    fileSize?: number,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      status,
    };

    if (status === 'completed' && fileUrl) {
      updates.file_url = fileUrl;
      updates.file_size = fileSize;
      updates.completed_at = new Date().toISOString();
    }

    if (status === 'failed' && errorMessage) {
      updates.error_message = errorMessage;
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('official_exports')
      .update(updates)
      .eq('id', exportId);

    if (error) throw error;
  },
};

