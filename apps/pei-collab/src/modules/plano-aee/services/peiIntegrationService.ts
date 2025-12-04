import { supabase } from '@pei/database';

export interface PEIGoal {
  id: string;
  pei_id: string;
  description: string;
  category?: 'academic' | 'functional';
  target_date?: string;
  progress_level?: string;
  barrier_id?: string;
}

export interface AEEActivitySuggestion {
  goal_id: string;
  goal_description: string;
  suggested_activities: Array<{
    activity_type: string;
    description: string;
    resources?: string[];
    methodology?: string;
  }>;
}

export interface GoalEvolution {
  goal_id: string;
  goal_description: string;
  progress_history: Array<{
    date: string;
    progress_level: string;
    notes?: string;
  }>;
  aee_sessions_count: number;
  last_session_date?: string;
}

export const peiIntegrationService = {
  /**
   * Busca metas do PEI vinculadas ao aluno
   */
  async getPEIGoals(studentId: string): Promise<PEIGoal[]> {
    // Buscar PEI ativo do aluno
    const { data: pei, error: peiError } = await supabase
      .from('peis')
      .select('id')
      .eq('student_id', studentId)
      .eq('is_active_version', true)
      .single();

    if (peiError || !pei) {
      return [];
    }

    // Buscar metas do PEI
    const { data: goals, error: goalsError } = await supabase
      .from('pei_goals')
      .select('*')
      .eq('pei_id', pei.id)
      .order('created_at', { ascending: true });

    if (goalsError) throw goalsError;
    return (goals || []) as PEIGoal[];
  },

  /**
   * Gera sugestões de atividades AEE baseadas nas metas do PEI
   */
  async getActivitySuggestions(studentId: string): Promise<AEEActivitySuggestion[]> {
    const goals = await this.getPEIGoals(studentId);

    const suggestions: AEEActivitySuggestion[] = [];

    for (const goal of goals) {
      // Buscar barreira relacionada se houver
      let barrierType = null;
      if (goal.barrier_id) {
        const { data: barrier } = await supabase
          .from('pei_barriers')
          .select('barrier_type')
          .eq('id', goal.barrier_id)
          .single();

        barrierType = barrier?.barrier_type || null;
      }

      // Gerar sugestões baseadas na categoria e barreira
      const suggestedActivities = this.generateActivitySuggestions(
        goal.category || 'academic',
        barrierType
      );

      suggestions.push({
        goal_id: goal.id,
        goal_description: goal.description,
        suggested_activities: suggestedActivities,
      });
    }

    return suggestions;
  },

  /**
   * Gera sugestões de atividades baseadas em categoria e barreira
   */
  generateActivitySuggestions(
    category: 'academic' | 'functional',
    barrierType: string | null
  ): AEEActivitySuggestion['suggested_activities'] {
    const suggestions: AEEActivitySuggestion['suggested_activities'] = [];

    // Sugestões genéricas por categoria
    if (category === 'academic') {
      suggestions.push({
        activity_type: 'Leitura e Escrita',
        description: 'Atividades de leitura e escrita adaptadas',
        resources: ['Material adaptado', 'Tecnologia assistiva'],
        methodology: 'Metodologia multissensorial',
      });
      suggestions.push({
        activity_type: 'Matemática',
        description: 'Atividades de matemática com recursos concretos',
        resources: ['Material manipulável', 'Calculadora adaptada'],
        methodology: 'Abordagem concreta-pictórica-abstrata',
      });
    } else {
      suggestions.push({
        activity_type: 'Autonomia',
        description: 'Atividades para desenvolvimento de autonomia',
        resources: ['Roteiros visuais', 'Agendas'],
        methodology: 'Treino de habilidades funcionais',
      });
      suggestions.push({
        activity_type: 'Socialização',
        description: 'Atividades de interação social',
        resources: ['Jogos cooperativos', 'Histórias sociais'],
        methodology: 'Intervenção mediada por pares',
      });
    }

    // Ajustar sugestões baseadas na barreira
    if (barrierType) {
      switch (barrierType.toLowerCase()) {
        case 'comunicação':
          suggestions.push({
            activity_type: 'Comunicação Alternativa',
            description: 'Atividades com CAA (Comunicação Alternativa e Aumentativa)',
            resources: ['Pranchas de comunicação', 'Aplicativos de CAA'],
            methodology: 'Sistema de comunicação por troca de figuras',
          });
          break;
        case 'mobilidade':
          suggestions.push({
            activity_type: 'Acessibilidade Física',
            description: 'Adaptações para acesso físico',
            resources: ['Mobiliário adaptado', 'Apoios'],
            methodology: 'Ajustes ambientais',
          });
          break;
        case 'cognição':
          suggestions.push({
            activity_type: 'Processamento Cognitivo',
            description: 'Atividades para desenvolvimento cognitivo',
            resources: ['Material concreto', 'Organizadores visuais'],
            methodology: 'Instrução direta e explícita',
          });
          break;
      }
    }

    return suggestions;
  },

  /**
   * Busca evolução das metas vinculadas ao PEI
   */
  async getGoalEvolution(studentId: string): Promise<GoalEvolution[]> {
    const goals = await this.getPEIGoals(studentId);

    const evolutions: GoalEvolution[] = [];

    for (const goal of goals) {
      // Buscar histórico de progresso do PEI
      const { data: pei } = await supabase
        .from('peis')
        .select('evaluation_data')
        .eq('student_id', studentId)
        .eq('is_active_version', true)
        .single();

      const evaluationData = pei?.evaluation_data as any;
      const goalProgress = evaluationData?.goals?.find(
        (g: any) => g.goal_id === goal.id
      );

      // Buscar sessões AEE relacionadas
      const { data: aeeSessions } = await supabase
        .from('aee_sessions')
        .select('date, notes')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      evolutions.push({
        goal_id: goal.id,
        goal_description: goal.description,
        progress_history: goalProgress?.history || [],
        aee_sessions_count: aeeSessions?.length || 0,
        last_session_date: aeeSessions?.[0]?.date || undefined,
      });
    }

    return evolutions;
  },

  /**
   * Vincula atividade AEE a uma meta do PEI
   */
  async linkActivityToGoal(
    aeeActivityId: string,
    peiGoalId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('aee_activity_pei_goals')
      .insert({
        aee_activity_id: aeeActivityId,
        pei_goal_id: peiGoalId,
      });

    if (error) throw error;
  },

  /**
   * Sincroniza progresso do AEE com o PEI
   */
  async syncProgressToPEI(
    studentId: string,
    goalId: string,
    progressLevel: string,
    notes?: string
  ): Promise<void> {
    // Buscar PEI ativo
    const { data: pei, error: peiError } = await supabase
      .from('peis')
      .select('id, evaluation_data')
      .eq('student_id', studentId)
      .eq('is_active_version', true)
      .single();

    if (peiError || !pei) throw new Error('PEI não encontrado');

    // Atualizar evaluation_data
    const evaluationData = (pei.evaluation_data as any) || {};
    const goals = evaluationData.goals || [];

    const goalIndex = goals.findIndex((g: any) => g.goal_id === goalId);
    if (goalIndex >= 0) {
      goals[goalIndex].progress_level = progressLevel;
      goals[goalIndex].last_updated = new Date().toISOString();
      if (notes) {
        goals[goalIndex].notes = notes;
      }
    } else {
      goals.push({
        goal_id: goalId,
        progress_level: progressLevel,
        last_updated: new Date().toISOString(),
        notes,
      });
    }

    evaluationData.goals = goals;
    evaluationData.last_aee_sync = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('peis')
      .update({ evaluation_data: evaluationData })
      .eq('id', pei.id);

    if (updateError) throw updateError;
  },
};


