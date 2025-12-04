import { supabase } from '@pei/database';

export interface AttendancePercentage {
  attendance_percentage: number;
  total_classes: number;
  present_classes: number;
  absent_classes: number;
  justified_absences: number;
  status: 'OK' | 'ALERTA' | 'CRÍTICO';
  period_start: string;
  period_end: string;
}

export interface AttendanceAlert {
  id: string;
  student_id: string;
  enrollment_id: string;
  period_start: string;
  period_end: string;
  attendance_percentage: number;
  total_classes: number;
  present_classes: number;
  absent_classes: number;
  justified_absences: number;
  status: 'OK' | 'ALERTA' | 'CRÍTICO';
  notified_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface StudentBelowThreshold {
  student_id: string;
  student_name: string;
  enrollment_id: string;
  class_name: string | null;
  attendance_percentage: number;
  status: string;
  total_classes: number;
  absent_classes: number;
  period_start: string;
  period_end: string;
}

export interface ApprovalValidation {
  can_approve: boolean;
  reason?: string;
  attendance_percentage?: number;
  attendance_data?: AttendancePercentage;
}

export const attendanceService = {
  /**
   * Calcula frequência do aluno no período especificado
   */
  async calculateAttendance(
    studentId: string,
    enrollmentId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<AttendancePercentage | null> {
    const { data, error } = await supabase.rpc('calculate_student_attendance_percentage', {
      p_student_id: studentId,
      p_enrollment_id: enrollmentId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) throw error;
    if (!data || (data as any).valid === false) return null;

    return data as AttendancePercentage;
  },

  /**
   * Busca alertas de frequência
   */
  async getAlerts(
    _schoolId?: string,
    status?: 'OK' | 'ALERTA' | 'CRÍTICO'
  ): Promise<AttendanceAlert[]> {
    let query = supabase
      .from('attendance_alerts')
      .select('*')
      .order('attendance_percentage', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    // Filtrar por escola se necessário (via RLS)
    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AttendanceAlert[];
  },

  /**
   * Busca alunos abaixo do threshold de frequência
   */
  async getStudentsBelowThreshold(
    schoolId?: string,
    threshold: number = 75.0,
    periodStart?: string,
    periodEnd?: string
  ): Promise<StudentBelowThreshold[]> {
    const { data, error } = await supabase.rpc('get_students_below_attendance_threshold', {
      p_school_id: schoolId || null,
      p_threshold: threshold,
      p_period_start: periodStart || null,
      p_period_end: periodEnd || null,
    });

    if (error) throw error;
    return (data || []) as StudentBelowThreshold[];
  },

  /**
   * Verifica se aluno pode ser aprovado baseado na frequência
   */
  async canApproveStudent(
    studentId: string,
    enrollmentId: string,
    academicYear?: number
  ): Promise<ApprovalValidation> {
    const { data, error } = await supabase.rpc('can_approve_student', {
      p_student_id: studentId,
      p_enrollment_id: enrollmentId,
      p_academic_year: academicYear || null,
    });

    if (error) throw error;
    return data as ApprovalValidation;
  },

  /**
   * Força verificação de frequência e criação de alertas
   */
  async checkAndCreateAlert(studentId: string, enrollmentId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('check_and_create_attendance_alert', {
      p_student_id: studentId,
      p_enrollment_id: enrollmentId,
    });

    if (error) throw error;
    return data as string | null;
  },

  /**
   * Resolve um alerta de frequência
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('attendance_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: resolutionNotes,
      })
      .eq('id', alertId);

    if (error) throw error;
  },
};

