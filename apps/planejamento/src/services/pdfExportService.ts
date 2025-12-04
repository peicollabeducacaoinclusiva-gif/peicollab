import { supabase } from '@pei/database';

export interface PDFExportConfig {
  include_pei_insights?: boolean;
  include_adaptations?: boolean;
  include_resources?: boolean;
  include_timeline?: boolean;
  format?: 'standard' | 'detailed' | 'simplified';
}

export const pdfExportService = {
  /**
   * Gera PDF de um planejamento
   */
  async exportPlanningToPDF(
    planningId: string,
    config: PDFExportConfig = {}
  ): Promise<string> {
    // Buscar dados do planejamento
    const { data: planning, error: planningError } = await supabase
      .from('pedagogical_plannings')
      .select('*')
      .eq('id', planningId)
      .single();

    if (planningError) throw planningError;

    // Buscar dados relacionados se necessário
    let peiInsights = null;
    let adaptations = null;
    let timeline = null;

    if (config.include_pei_insights) {
      const insights = await supabase.rpc('get_planning_insights', {
        p_class_id: planning.class_id,
        p_date: planning.start_date,
      });
      peiInsights = insights.data;
    }

    if (config.include_adaptations) {
      const { data: adaptationsData } = await supabase
        .from('planning_pei_links')
        .select('*')
        .eq('planning_id', planningId)
        .eq('link_type', 'adaptation');
      adaptations = adaptationsData;
    }

    if (config.include_timeline) {
      const { data: timelineData } = await supabase.rpc('get_class_timeline', {
        p_class_id: planning.class_id,
        p_start_date: planning.start_date,
        p_end_date: planning.end_date || planning.start_date,
      });
      timeline = timelineData;
    }

    // Preparar dados para exportação
    const exportData = {
      planning,
      pei_insights: peiInsights,
      adaptations,
      timeline,
      config,
    };

    // Chamar Edge Function para gerar PDF
    const { data, error } = await supabase.functions.invoke('generate-planning-pdf', {
      body: exportData,
    });

    if (error) throw error;

    // Retornar URL do PDF gerado
    return data.file_url as string;
  },

  /**
   * Gera PDF de múltiplos planejamentos
   */
  async exportMultiplePlanningsToPDF(
    planningIds: string[],
    config: PDFExportConfig = {}
  ): Promise<string> {
    const { data, error } = await supabase.functions.invoke('generate-planning-pdf', {
      body: {
        planning_ids: planningIds,
        config,
      },
    });

    if (error) throw error;
    return data.file_url as string;
  },
};

