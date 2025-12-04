import { supabase } from '@pei/database';

export type EvaluationType = 'prova' | 'registro_descritivo' | 'rubrica' | 'formativa' | 'eja' | 'conceito' | 'infantil';
export type Regime = 'numerico' | 'descritivo' | 'eja' | 'infantil';

export interface EvaluationTypeDefinition {
  id: string;
  type_name: EvaluationType;
  display_name: string;
  description?: string;
  schema_template: Record<string, any>;
  enabled: boolean;
  created_at: string;
}

export interface Rubric {
  id: string;
  tenant_id?: string;
  rubric_name: string;
  description?: string;
  criteria: Array<{
    name: string;
    description?: string;
    levels: Array<{
      level: string | number;
      description: string;
      score?: number;
    }>;
  }>;
  scale_type: 'numeric' | 'descriptive' | 'levels';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  class_id: string;
  subject_id?: string;
  evaluation_type_id?: string;
  title: string;
  date: string;
  evaluation_data: Record<string, any>;
  regime?: Regime;
  rubric_id?: string;
  pei_goal_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface EvaluationResult {
  id: string;
  evaluation_id: string;
  student_id: string;
  result_data: Record<string, any>;
  score?: number;
  concept?: string;
  description?: string;
  rubric_scores?: Record<string, any>;
  pei_goal_progress?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const universalEvaluationService = {
  /**
   * Busca tipos de avaliação disponíveis
   */
  async getEvaluationTypes(): Promise<EvaluationTypeDefinition[]> {
    const { data, error } = await supabase
      .from('evaluation_types')
      .select('*')
      .eq('enabled', true)
      .order('display_name', { ascending: true });

    if (error) throw error;
    return (data || []) as EvaluationTypeDefinition[];
  },

  /**
   * Cria uma avaliação universal
   */
  async createEvaluation(
    classId: string,
    subjectId: string | undefined,
    evaluationType: EvaluationType,
    title: string,
    date: string,
    evaluationData?: Record<string, any>,
    regime?: Regime
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_universal_evaluation', {
      p_class_id: classId,
      p_subject_id: subjectId || null,
      p_evaluation_type_name: evaluationType,
      p_title: title,
      p_date: date,
      p_evaluation_data: evaluationData || {},
      p_regime: regime || null,
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Busca avaliações de uma turma
   */
  async getEvaluations(
    classId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Evaluation[]> {
    let query = supabase
      .from('evaluations')
      .select('*')
      .eq('class_id', classId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Evaluation[];
  },

  /**
   * Registra resultado de avaliação
   */
  async createResult(
    evaluationId: string,
    studentId: string,
    resultData: Record<string, any>,
    score?: number,
    concept?: string,
    description?: string,
    rubricScores?: Record<string, any>,
    peiGoalProgress?: Record<string, any>
  ): Promise<EvaluationResult> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .upsert(
        {
          evaluation_id: evaluationId,
          student_id: studentId,
          result_data: resultData,
          score,
          concept,
          description,
          rubric_scores: rubricScores,
          pei_goal_progress: peiGoalProgress,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'evaluation_id,student_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as EvaluationResult;
  },

  /**
   * Busca rubricas
   */
  async getRubrics(tenantId?: string): Promise<Rubric[]> {
    let query = supabase
      .from('rubrics')
      .select('*')
      .order('rubric_name', { ascending: true });

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Rubric[];
  },

  /**
   * Cria uma rubrica
   */
  async createRubric(rubric: Partial<Rubric>): Promise<Rubric> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('rubrics')
      .insert({
        ...rubric,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Rubric;
  },
};

