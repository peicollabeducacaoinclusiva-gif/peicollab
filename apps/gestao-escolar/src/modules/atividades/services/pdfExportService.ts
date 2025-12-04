import { supabase } from '@pei/database';

export interface PDFExportOptions {
  include_rubrics?: boolean;
  include_adaptations?: boolean;
  include_feedback?: boolean;
  format?: 'standard' | 'detailed' | 'simplified';
}

export const pdfExportService = {
  /**
   * Exporta atividade para PDF
   */
  async exportActivityToPDF(
    activityId: string,
    options: PDFExportOptions = {}
  ): Promise<string> {
    // Buscar dados da atividade
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (activityError) throw activityError;

    // Buscar dados relacionados se necessário
    let peiGoal = null;
    let aeeObjective = null;
    let rubric = null;

    if (activity.pei_goal_id) {
      const { data: peiData } = await supabase
        .from('pei_goals')
        .select('*')
        .eq('id', activity.pei_goal_id)
        .single();
      peiGoal = peiData;
    }

    if (activity.aee_objective_id) {
      const { data: aeeData } = await supabase
        .from('aee_objectives')
        .select('*')
        .eq('id', activity.aee_objective_id)
        .single();
      aeeObjective = aeeData;
    }

    if (options.include_rubrics && activity.rubric_id) {
      const { data: rubricData } = await supabase
        .from('rubrics')
        .select('*')
        .eq('id', activity.rubric_id)
        .single();
      rubric = rubricData;
    }

    // Preparar dados para exportação
    const exportData = {
      activity,
      pei_goal: peiGoal,
      aee_objective: aeeObjective,
      rubric: options.include_rubrics ? rubric : null,
      adaptations: options.include_adaptations ? activity.adaptation_applied : null,
      options,
    };

    // Chamar Edge Function para gerar PDF
    const { data, error } = await supabase.functions.invoke('generate-activity-pdf', {
      body: exportData,
    });

    if (error) throw error;

    // Retornar URL do PDF gerado
    return data.file_url as string;
  },

  /**
   * Gera PDF localmente (fallback)
   */
  async generatePDFLocal(activity: any, options: PDFExportOptions = {}): Promise<Blob> {
    // Esta função seria implementada com biblioteca de PDF (jsPDF, pdfkit, etc.)
    // Por enquanto, retornar blob vazio
    const htmlContent = this.generateHTMLForPDF(activity, options);
    
    // Em produção, usar biblioteca como html2pdf ou similar
    return new Blob([htmlContent], { type: 'text/html' });
  },

  /**
   * Gera HTML para PDF
   */
  generateHTMLForPDF(activity: any, options: PDFExportOptions): string {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${activity.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .content { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>${activity.title}</h1>
        ${activity.description ? `<p>${activity.description}</p>` : ''}
        <div class="content">
          ${this.renderContentBlocks(activity.content)}
        </div>
    `;

    if (options.include_adaptations && activity.adaptation_applied) {
      html += `<div class="adaptations"><h2>Adaptações</h2><pre>${JSON.stringify(activity.adaptation_applied, null, 2)}</pre></div>`;
    }

    html += `</body></html>`;
    return html;
  },

  /**
   * Renderiza blocos de conteúdo
   */
  renderContentBlocks(content: any): string {
    if (!content.blocks || !Array.isArray(content.blocks)) {
      return '';
    }

    return content.blocks.map((block: any) => {
      switch (block.type) {
        case 'heading1':
          return `<h1>${block.content}</h1>`;
        case 'heading2':
          return `<h2>${block.content}</h2>`;
        case 'bulleted-list':
          return `<ul><li>${block.content}</li></ul>`;
        case 'numbered-list':
          return `<ol><li>${block.content}</li></ol>`;
        default:
          return `<p>${block.content}</p>`;
      }
    }).join('');
  },
};

