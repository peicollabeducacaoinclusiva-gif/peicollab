import { supabase } from '@pei/database';

export interface AIFeedback {
  explanation: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  adapted_for_student?: boolean;
}

export interface FeedbackRequest {
  activityId: string;
  studentId: string;
  responseData: Record<string, any>;
  peiGoalId?: string;
  aeeObjectiveId?: string;
}

export const aiFeedbackService = {
  /**
   * Gera feedback com IA para resposta de atividade
   */
  async generateFeedback(request: FeedbackRequest): Promise<AIFeedback> {
    // Buscar dados do aluno e PEI/AEE
    const studentData = await this.getStudentContext(request.studentId, request.peiGoalId, request.aeeObjectiveId);
    
    // Preparar prompt para IA (estrutura para integração futura)
    const prompt = this.buildFeedbackPrompt(request, studentData);

    // Por enquanto, retornar feedback estruturado básico
    // Em produção, isso seria integrado com serviço de IA (OpenAI, Anthropic, etc.)
    return this.generateStructuredFeedback(request.responseData, studentData);
  },

  /**
   * Busca contexto do aluno para feedback adaptado
   */
  async getStudentContext(
    studentId: string,
    peiGoalId?: string,
    aeeObjectiveId?: string
  ): Promise<Record<string, any>> {
    const context: Record<string, any> = {};

    // Buscar PEI se fornecido
    if (peiGoalId) {
      const { data: peiGoal } = await supabase
        .from('pei_goals')
        .select('description, category, progress_level')
        .eq('id', peiGoalId)
        .single();

      if (peiGoal) {
        context.pei_goal = peiGoal;
      }
    }

    // Buscar objetivo AEE se fornecido
    if (aeeObjectiveId) {
      const { data: aeeObjective } = await supabase
        .from('aee_objectives')
        .select('title, description, objective_type')
        .eq('id', aeeObjectiveId)
        .single();

      if (aeeObjective) {
        context.aee_objective = aeeObjective;
      }
    }

    return context;
  },

  /**
   * Constrói prompt para IA
   */
  buildFeedbackPrompt(request: FeedbackRequest, studentContext: Record<string, any>): string {
    let prompt = `Gere feedback pedagógico para a resposta de atividade do aluno.\n\n`;
    prompt += `Resposta do aluno: ${JSON.stringify(request.responseData)}\n\n`;

    if (studentContext.pei_goal) {
      prompt += `Meta do PEI relacionada: ${studentContext.pei_goal.description}\n`;
      prompt += `Categoria: ${studentContext.pei_goal.category}\n`;
    }

    if (studentContext.aee_objective) {
      prompt += `Objetivo AEE relacionado: ${studentContext.aee_objective.title}\n`;
    }

    prompt += `\nGere feedback que:\n`;
    prompt += `- Seja construtivo e encorajador\n`;
    prompt += `- Destaque pontos fortes\n`;
    prompt += `- Sugira melhorias específicas\n`;
    prompt += `- Adapte a linguagem conforme necessário\n`;

    return prompt;
  },

  /**
   * Gera feedback estruturado (versão básica sem IA real)
   */
  generateStructuredFeedback(
    responseData: Record<string, any>,
    studentContext: Record<string, any>
  ): AIFeedback {
    // Feedback básico estruturado
    // Em produção, isso seria substituído por chamada real à API de IA
    return {
      explanation: 'Parabéns pelo esforço! Continue praticando para melhorar ainda mais.',
      strengths: [
        'Demonstrou compreensão do conteúdo',
        'Respostas organizadas',
      ],
      improvements: [
        'Revisar conceitos relacionados',
        'Praticar mais exercícios similares',
      ],
      suggestions: [
        'Continue praticando regularmente',
        'Peça ajuda quando necessário',
      ],
      adapted_for_student: !!(studentContext.pei_goal || studentContext.aee_objective),
    };
  },

  /**
   * Salva feedback gerado por IA
   */
  async saveAIFeedback(
    activityId: string,
    studentId: string,
    feedback: AIFeedback
  ): Promise<void> {
    const { error } = await supabase
      .from('activity_responses')
      .upsert(
        {
          activity_id: activityId,
          student_id: studentId,
          ai_feedback: feedback,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'activity_id,student_id',
        }
      );

    if (error) throw error;
  },
};

