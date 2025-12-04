import { supabase } from '@pei/database';

export interface LearningHistoryEntry {
  id: string;
  student_id: string;
  academic_year: number;
  period?: string;
  period_number?: number;
  subject_id?: string;
  attendance_rate?: number;
  average_grade?: number;
  performance_indicators?: Record<string, any>;
  pei_goals_progress?: Array<{
    goal_id: string;
    goal_description: string;
    progress_level: string;
  }>;
  aee_sessions_count?: number;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningIndicators {
  attendance_rate: number;
  average_grade: number;
  subjects_count: number;
  pei_goals_count: number;
  aee_sessions_count: number;
  calculated_at: string;
}

export const learningHistoryService = {
  /**
   * Busca histórico de aprendizagem de um aluno
   */
  async getLearningHistory(
    studentId: string,
    academicYear?: number
  ): Promise<LearningHistoryEntry[]> {
    let query = supabase
      .from('student_learning_history')
      .select('*')
      .eq('student_id', studentId)
      .order('academic_year', { ascending: false })
      .order('period_number', { ascending: false });

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as LearningHistoryEntry[];
  },

  /**
   * Calcula indicadores de aprendizagem
   */
  async calculateIndicators(
    studentId: string,
    academicYear: number,
    period?: string
  ): Promise<LearningIndicators> {
    const { data, error } = await supabase.rpc('calculate_learning_indicators', {
      p_student_id: studentId,
      p_academic_year: academicYear,
      p_period: period || null,
    });

    if (error) throw error;
    return data as LearningIndicators;
  },

  /**
   * Cria ou atualiza entrada no histórico
   */
  async upsertHistoryEntry(entry: Partial<LearningHistoryEntry>): Promise<LearningHistoryEntry> {
    const { data, error } = await supabase
      .from('student_learning_history')
      .upsert(
        {
          ...entry,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'student_id,academic_year,period,period_number,subject_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as LearningHistoryEntry;
  },

  /**
   * Busca desempenho por eixo/área
   */
  async getPerformanceByAxis(
    studentId: string,
    academicYear: number
  ): Promise<Record<string, any>> {
    const history = await this.getLearningHistory(studentId, academicYear);

    const performanceByAxis: Record<string, any> = {};

    history.forEach((entry) => {
      if (entry.performance_indicators) {
        Object.entries(entry.performance_indicators).forEach(([axis, value]) => {
          if (!performanceByAxis[axis]) {
            performanceByAxis[axis] = {
              axis,
              entries: [],
              average: 0,
            };
          }
          performanceByAxis[axis].entries.push({
            period: entry.period,
            period_number: entry.period_number,
            value,
          });
        });
      }
    });

    // Calcular médias
    Object.keys(performanceByAxis).forEach((axis) => {
      const entries = performanceByAxis[axis].entries;
      if (entries.length > 0) {
        const sum = entries.reduce((acc: number, e: any) => acc + (e.value || 0), 0);
        performanceByAxis[axis].average = sum / entries.length;
      }
    });

    return performanceByAxis;
  },

  /**
   * Busca progresso das metas do PEI no histórico
   */
  async getPEIGoalsProgress(
    studentId: string,
    academicYear: number
  ): Promise<Array<{ goal_id: string; goal_description: string; progress_history: any[] }>> {
    const history = await this.getLearningHistory(studentId, academicYear);

    const goalsMap = new Map<string, any>();

    history.forEach((entry) => {
      if (entry.pei_goals_progress) {
        entry.pei_goals_progress.forEach((goal: any) => {
          if (!goalsMap.has(goal.goal_id)) {
            goalsMap.set(goal.goal_id, {
              goal_id: goal.goal_id,
              goal_description: goal.goal_description,
              progress_history: [],
            });
          }

          goalsMap.get(goal.goal_id)!.progress_history.push({
            period: entry.period,
            period_number: entry.period_number,
            progress_level: goal.progress_level,
            date: entry.created_at,
          });
        });
      }
    });

    return Array.from(goalsMap.values());
  },
};

