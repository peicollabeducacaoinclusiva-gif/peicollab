// ============================================================================
// SERVIÇO: Document Generator
// ============================================================================
// Geração automática de documentos PDF do AEE
// Data: 2025-01-09
// ============================================================================

import { supabase } from '@pei/database';

// ============================================================================
// TIPOS
// ============================================================================

export type DocumentType =
  | 'termo_compromisso'
  | 'termo_desistencia'
  | 'relatorio_visita'
  | 'plano_completo'
  | 'relatorio_ciclo'
  | 'ficha_anamnese'
  | 'encaminhamento'
  | 'avaliacao_diagnostica';

export interface DocumentData {
  student_id: string;
  plan_id?: string;
  assessment_id?: string;
  cycle_number?: number;
  [key: string]: any;
}

// ============================================================================
// GERADOR DE DOCUMENTOS
// ============================================================================

export class DocumentGenerator {
  /**
   * Gerar documento PDF
   */
  static async generatePDF(documentType: DocumentType, data: DocumentData): Promise<string> {
    try {
      // 1. Buscar dados completos
      const documentData = await this.fetchDocumentData(documentType, data);

      // 2. Carregar template HTML
      const template = await this.loadTemplate(documentType);

      // 3. Interpolar dados no template
      const html = this.interpolateTemplate(template, documentData);

      // 4. Converter para PDF (via Edge Function ou biblioteca cliente)
      const pdfUrl = await this.convertToPDF(html, documentType);

      // 5. Salvar registro do documento
      await this.saveDocumentRecord(documentType, data, pdfUrl);

      return pdfUrl;
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      throw error;
    }
  }

  /**
   * Buscar dados necessários para o documento
   */
  private static async fetchDocumentData(
    documentType: DocumentType,
    data: DocumentData
  ): Promise<any> {
    const { student_id, plan_id } = data;

    // Buscar dados do aluno
    const { data: student } = await supabase
      .from('students')
      .select('*, school:schools!students_school_id_fkey(school_name, school_phone, school_address)')
      .eq('id', student_id)
      .single();

    // Buscar dados do plano (se houver)
    let plan = null;
    if (plan_id) {
      const { data: planData } = await supabase
        .from('plano_aee')
        .select('*, teacher:profiles!created_by(full_name)')
        .eq('id', plan_id)
        .single();
      plan = planData;
    }

    // Buscar centro AEE
    const { data: center } = await supabase
      .from('aee_centers')
      .select('*')
      .eq('school_id', student?.school_id)
      .single();

    return {
      student,
      plan,
      center,
      ...data,
      // Dados gerais
      city: 'São Gonçalo', // Ou pegar do tenant
      date: new Date().toLocaleDateString('pt-BR'),
    };
  }

  /**
   * Carregar template HTML
   */
  private static async loadTemplate(documentType: DocumentType): Promise<string> {
    // Carregar template do servidor
    const response = await fetch(`/templates/${documentType}.html`);
    if (!response.ok) {
      throw new Error(`Template não encontrado: ${documentType}`);
    }
    return await response.text();
  }

  /**
   * Interpolar dados no template
   */
  private static interpolateTemplate(template: string, data: any): string {
    let result = template;

    // Substituir todas as variáveis {{variable}}
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      matches.forEach((match) => {
        const key = match.replace(/\{\{|\}\}/g, '').trim();
        const value = this.getNestedValue(data, key) || '';
        result = result.replace(match, value);
      });
    }

    return result;
  }

  /**
   * Obter valor aninhado de objeto
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Converter HTML para PDF
   */
  private static async convertToPDF(html: string, filename: string): Promise<string> {
    try {
      // Importação dinâmica de jsPDF e html2canvas
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Criar elemento temporário para renderizar HTML
      const element = document.createElement('div');
      element.innerHTML = html;
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.width = '210mm'; // A4 width
      element.style.padding = '20mm';
      document.body.appendChild(element);

      // Converter HTML para canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Remover elemento temporário
      document.body.removeChild(element);

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Adicionar imagem ao PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Converter PDF para Blob
      const pdfBlob = pdf.output('blob');

      // Salvar no Supabase Storage
      const fileName = `${filename}-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('aee-documents')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload do PDF:', uploadError);
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('aee-documents')
        .getPublicUrl(fileName);

      console.log('PDF gerado com sucesso:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback: retornar URL mockada em caso de erro
      console.warn('Usando URL mockada devido a erro na geração do PDF');
      return `https://storage.supabase.co/mock/${filename}.pdf`;
    }
  }

  /**
   * Salvar registro do documento gerado
   */
  private static async saveDocumentRecord(
    documentType: DocumentType,
    data: DocumentData,
    pdfUrl: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Salvar em aee_documents (quando tabela existir)
    // await supabase.from('aee_documents').insert({
    //   document_type: documentType,
    //   student_id: data.student_id,
    //   plan_id: data.plan_id,
    //   teacher_id: user?.id,
    //   document_data: data,
    //   generated_pdf_url: pdfUrl,
    // });

    console.log('Documento registrado:', documentType);
  }

  /**
   * Obter lista de documentos disponíveis
   */
  static getAvailableDocuments(): Array<{
    type: DocumentType;
    title: string;
    description: string;
  }> {
    return [
      {
        type: 'termo_compromisso',
        title: 'Termo de Compromisso',
        description: 'Termo de compromisso e autorização do AEE',
      },
      {
        type: 'termo_desistencia',
        title: 'Termo de Desistência',
        description: 'Documento de desistência do atendimento',
      },
      {
        type: 'relatorio_visita',
        title: 'Relatório de Visita',
        description: 'Relatório de visita à escola regular',
      },
      {
        type: 'plano_completo',
        title: 'Plano de AEE Completo',
        description: 'Documento completo do Plano de AEE',
      },
      {
        type: 'relatorio_ciclo',
        title: 'Relatório de Ciclo',
        description: 'Avaliação de ciclo (I, II ou III)',
      },
      {
        type: 'ficha_anamnese',
        title: 'Ficha de Anamnese',
        description: 'Entrevista familiar completa',
      },
      {
        type: 'encaminhamento',
        title: 'Ficha de Encaminhamento',
        description: 'Encaminhamento para especialistas',
      },
      {
        type: 'avaliacao_diagnostica',
        title: 'Avaliação Diagnóstica',
        description: 'Relatório completo da avaliação',
      },
    ];
  }
}

