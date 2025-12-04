import { supabase } from '@pei/database';

/**
 * Tipos para Dashboards Avançados
 */

export interface AttendanceMetrics {
  total_students: number;
  average_attendance_rate: number;
  students_low_attendance: number;
  attendance_trend: Array<{ date: string; rate: number }>;
  class_attendance: Array<{
    class_name: string;
    total_students: number;
    avg_attendance_rate: number;
  }>;
}

export interface StudentAtRisk {
  student_id: string;
  student_name: string;
  class_name: string;
  risk_type: 'attendance' | 'grades' | 'inclusion';
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  risk_factors: {
    attendance_rate?: number;
    avg_grade?: number;
    has_pei?: boolean;
  };
  last_updated: string;
}

export interface ClassEvolution {
  class_id: string;
  class_name: string;
  total_students: number;
  attendance_evolution: Array<{ month: string; rate: number }>;
  grades_evolution: Array<{ month: string; avg_grade: number }>;
  performance_trend: 'melhorando' | 'piorando' | 'estável';
}

export interface InclusionMetrics {
  total_students_with_needs: number;
  students_with_pei: number;
  students_with_aee: number;
  pei_coverage_rate: number;
  aee_coverage_rate: number;
  needs_distribution: Array<{ need: string; count: number }>;
  aee_effectiveness: number;
}

/**
 * Serviço centralizado para Dashboards
 */
export const dashboardService = {
  /**
   * Métricas de Frequência
   */
  async getSchoolAttendanceMetrics(
    schoolId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<AttendanceMetrics> {
    const { data, error } = await supabase.rpc('get_school_attendance_metrics', {
      p_school_id: schoolId,
      p_period_start: periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_period_end: periodEnd || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    // A RPC retorna uma linha, não um array
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
    return {
      total_students: Number(result?.total_students || 0),
      average_attendance_rate: Number(result?.average_attendance_rate || 0),
      students_low_attendance: Number(result?.students_low_attendance || 0),
      attendance_trend: Array.isArray(result?.attendance_trend) 
        ? result.attendance_trend 
        : typeof result?.attendance_trend === 'object' 
        ? Object.values(result.attendance_trend) 
        : [],
      class_attendance: Array.isArray(result?.class_attendance) 
        ? result.class_attendance 
        : typeof result?.class_attendance === 'object' 
        ? Object.values(result.class_attendance) 
        : [],
    } as AttendanceMetrics;
  },

  /**
   * Alunos com Risco
   */
  async getStudentsAtRisk(
    schoolId?: string,
    tenantId?: string,
    riskType: 'all' | 'attendance' | 'grades' | 'inclusion' = 'all'
  ): Promise<StudentAtRisk[]> {
    const { data, error } = await supabase.rpc('get_students_at_risk', {
      p_school_id: schoolId || null,
      p_tenant_id: tenantId || null,
      p_risk_type: riskType,
    });

    if (error) throw error;
    return (data || []) as StudentAtRisk[];
  },

  /**
   * Evolução das Turmas
   */
  async getClassEvolution(
    schoolId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<ClassEvolution[]> {
    const { data, error } = await supabase.rpc('get_class_evolution', {
      p_school_id: schoolId,
      p_period_start: periodStart || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_period_end: periodEnd || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    return (data || []) as ClassEvolution[];
  },

  /**
   * Indicadores de Inclusão
   */
  async getInclusionMetrics(
    schoolId?: string,
    tenantId?: string
  ): Promise<InclusionMetrics> {
    const { data, error } = await supabase.rpc('get_inclusion_metrics', {
      p_school_id: schoolId || null,
      p_tenant_id: tenantId || null,
    });

    if (error) throw error;
    // A RPC retorna uma linha, não um array
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
    return {
      total_students_with_needs: Number(result?.total_students_with_needs || 0),
      students_with_pei: Number(result?.students_with_pei || 0),
      students_with_aee: Number(result?.students_with_aee || 0),
      pei_coverage_rate: Number(result?.pei_coverage_rate || 0),
      aee_coverage_rate: Number(result?.aee_coverage_rate || 0),
      needs_distribution: Array.isArray(result?.needs_distribution)
        ? result.needs_distribution
        : typeof result?.needs_distribution === 'object'
        ? Object.values(result.needs_distribution)
        : [],
      aee_effectiveness: Number(result?.aee_effectiveness || 0),
    } as InclusionMetrics;
  },
};

