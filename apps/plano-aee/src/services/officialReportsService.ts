import { supabase } from '@pei/database';

export interface OfficialReportConfig {
  format: 'sed' | 'seduc' | 'inep' | 'municipal';
  include_sessions: boolean;
  include_objectives: boolean;
  include_methodologies: boolean;
  include_technologies: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface OfficialReport {
  id: string;
  aee_id: string;
  report_type: string;
  generated_at: string;
  generated_by: string;
  file_url?: string;
  metadata: Record<string, any>;
}

export const officialReportsService = {
  /**
   * Gera relatório oficial no formato especificado
   */
  async generateOfficialReport(
    aeeId: string,
    config: OfficialReportConfig
  ): Promise<OfficialReport> {
    const { data: { user } } = await supabase.auth.getUser();

    // Buscar dados do AEE
    const { data: aeeData, error: aeeError } = await supabase
      .from('plano_aee')
      .select('*')
      .eq('id', aeeId)
      .single();

    if (aeeError) throw aeeError;

    // Buscar dados estruturados
    const structuredPlan = await supabase.rpc('get_structured_aee_plan', {
      p_aee_id: aeeId,
    });

    // Buscar sessões se necessário
    let sessions = null;
    if (config.include_sessions && config.date_range) {
      const { data: sessionsData } = await supabase
        .from('aee_sessions')
        .select('*')
        .eq('aee_id', aeeId)
        .gte('date', config.date_range.start)
        .lte('date', config.date_range.end)
        .order('date', { ascending: true });

      sessions = sessionsData;
    }

    // Formatar relatório conforme o tipo
    const reportData = formatReportByType(aeeData, structuredPlan.data, sessions, config);

    // Criar registro do relatório
    const { data: report, error: reportError } = await supabase
      .from('aee_official_reports')
      .insert({
        aee_id: aeeId,
        report_type: config.format,
        generated_by: user?.id,
        metadata: reportData,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    return report as OfficialReport;
  },

  /**
   * Busca relatórios gerados
   */
  async getReports(aeeId: string): Promise<OfficialReport[]> {
    const { data, error } = await supabase
      .from('aee_official_reports')
      .select('*')
      .eq('aee_id', aeeId)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as OfficialReport[];
  },

  /**
   * Exporta relatório para PDF
   */
  async exportToPDF(reportId: string): Promise<string> {
    // Esta função seria implementada com uma Edge Function ou biblioteca de PDF
    // Por enquanto, retorna URL vazia
    const { data, error } = await supabase
      .from('aee_official_reports')
      .select('file_url')
      .eq('id', reportId)
      .single();

    if (error) throw error;
    return data?.file_url || '';
  },
};

/**
 * Formata relatório conforme o tipo especificado
 */
function formatReportByType(
  aeeData: any,
  structuredPlan: any,
  sessions: any[] | null,
  config: OfficialReportConfig
): Record<string, any> {
  const baseReport = {
    student_id: aeeData.student_id,
    school_id: aeeData.school_id,
    start_date: aeeData.start_date,
    end_date: aeeData.end_date,
    status: aeeData.status,
  };

  switch (config.format) {
    case 'sed':
      return {
        ...baseReport,
        objectives: config.include_objectives ? structuredPlan?.objectives : [],
        methodologies: config.include_methodologies ? structuredPlan?.methodologies : [],
        sessions: config.include_sessions ? sessions : [],
      };

    case 'seduc':
      return {
        ...baseReport,
        anamnesis: aeeData.anamnesis_data,
        barriers: aeeData.learning_barriers,
        objectives: config.include_objectives ? structuredPlan?.objectives : [],
        resources: aeeData.resources,
        adaptations: aeeData.adaptations,
        sessions: config.include_sessions ? sessions : [],
      };

    case 'inep':
      return {
        ...baseReport,
        diagnosis_tools: aeeData.diagnosis_tools,
        objectives: config.include_objectives ? structuredPlan?.objectives : [],
        assistive_technologies: config.include_technologies ? structuredPlan?.assistive_technologies : [],
        evaluation_methodology: aeeData.evaluation_methodology,
      };

    case 'municipal':
      return {
        ...baseReport,
        ...aeeData,
        structured_plan: structuredPlan,
        sessions: config.include_sessions ? sessions : [],
      };

    default:
      return baseReport;
  }
}

