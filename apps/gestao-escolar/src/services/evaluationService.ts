import { supabase } from '@pei/database';

export type EvaluationType = 'numeric' | 'conceptual' | 'descriptive';
export type GradeCalculationMethod = 'arithmetic' | 'weighted' | 'bimester_average';

export interface EvaluationConfig {
  id: string;
  tenant_id: string;
  school_id?: string;
  academic_year: number;
  evaluation_type: EvaluationType;
  calculation_method: GradeCalculationMethod;
  passing_grade: number;
  max_grade: number;
  weights?: Record<string, number>; // Para cálculo ponderado
  formula?: string; // Para fórmulas personalizadas
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  enrollment_id: string;
  subject_id: string;
  academic_year: number;
  period: number; // 1, 2, 3, 4 (bimestres) ou 1, 2 (semestres)
  grade_value: number | null; // Para avaliação numérica
  conceptual_grade?: string; // Para avaliação conceitual (A, B, C, D, E)
  descriptive_grade?: string; // Para avaliação descritiva
  evaluation_type: EvaluationType;
  tenant_id?: string;
  school_id?: string;
  class_id?: string;
  diary_entry_id?: string | null; // Relacionamento com diário
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  enrollment_id: string;
  subject_id: string | null; // null para frequência geral
  academic_year: number;
  period: number;
  total_classes: number;
  present_classes: number;
  absent_classes: number;
  justified_absences: number;
  attendance_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface DescriptiveReport {
  id: string;
  student_id: string;
  enrollment_id: string;
  academic_year: number;
  period: number;
  report_text: string;
  created_by: string;
  diary_entry_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const evaluationService = {
  async getEvaluationConfig(tenantId: string, schoolId?: string, academicYear?: number) {
    let query = supabase
      .from('evaluation_configs')
      .select('*')
      .eq('tenant_id', tenantId);

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    } else {
      query = query.is('school_id', null);
    }

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createEvaluationConfig(config: Partial<EvaluationConfig>) {
    const { data, error } = await supabase
      .from('evaluation_configs')
      .insert({
        tenant_id: config.tenant_id,
        school_id: config.school_id,
        academic_year: config.academic_year || new Date().getFullYear(),
        evaluation_type: config.evaluation_type || 'numeric',
        calculation_method: config.calculation_method || 'arithmetic',
        passing_grade: config.passing_grade || 6.0,
        max_grade: config.max_grade || 10.0,
        weights: config.weights || {},
        formula: config.formula,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvaluationConfig(configId: string, updates: Partial<EvaluationConfig>) {
    const { data, error } = await supabase
      .from('evaluation_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGrades(filters: {
    tenantId: string;
    studentId?: string;
    enrollmentId?: string;
    subjectId?: string;
    academicYear: number;
    period?: number;
  }) {
    let query = supabase
      .from('grades')
      .select('*')
      .eq('academic_year', filters.academicYear);

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.enrollmentId) {
      query = query.eq('enrollment_id', filters.enrollmentId);
    }

    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }

    if (filters.period) {
      query = query.eq('period', filters.period);
    }

    const { data, error } = await query.order('period', { ascending: true });

    if (error) throw error;
    
    // Buscar dados relacionados separadamente se necessário
    const grades = (data || []) as any[];
    if (grades.length > 0) {
      const studentIds = [...new Set(grades.map(g => g.student_id).filter(Boolean))];
      const subjectIds = [...new Set(grades.map(g => g.subject_id).filter(Boolean))];
      
      const [studentsResult, subjectsResult] = await Promise.all([
        studentIds.length > 0 
          ? supabase.from('students').select('id, name').in('id', studentIds)
          : Promise.resolve({ data: [], error: null }),
        subjectIds.length > 0
          ? supabase.from('subjects').select('id, subject_name').in('id', subjectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      
      const studentsMap = new Map((studentsResult.data || []).map((s: any) => [s.id, s.name]));
      const subjectsMap = new Map((subjectsResult.data || []).map((s: any) => [s.id, s.subject_name]));
      
      return grades.map(grade => ({
        ...grade,
        student_name: studentsMap.get(grade.student_id),
        subject_name: subjectsMap.get(grade.subject_id),
      }));
    }
    
    return grades;
  },

  async createGrade(grade: Partial<Grade>) {
    const { data, error } = await supabase
      .from('grades')
      .insert({
        student_id: grade.student_id,
        enrollment_id: grade.enrollment_id,
        subject_id: grade.subject_id,
        academic_year: grade.academic_year,
        period: grade.period,
        grade_value: grade.grade_value,
        conceptual_grade: grade.conceptual_grade,
        descriptive_grade: grade.descriptive_grade,
        evaluation_type: grade.evaluation_type || 'numeric',
        tenant_id: grade.tenant_id,
        school_id: grade.school_id,
        class_id: grade.class_id,
        diary_entry_id: grade.diary_entry_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async submitGrade(grade: Partial<Grade>) {
    return this.createGrade(grade);
  },

  async getGradesByClassSubjectPeriod(
    classId: string,
    subjectId: string,
    academicYear: number,
    period: string | number
  ) {
    const periodNum = typeof period === 'string' ? parseInt(period) : period;

    // Buscar alunos da turma
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_enrollments')
      .select('id, student_id')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('status', 'active');

    if (enrollmentsError) throw enrollmentsError;

    const enrollmentIds = (enrollments || []).map(e => e.id);

    if (enrollmentIds.length === 0) return [];

    // Buscar notas dos alunos da turma
    const { data, error } = await supabase
      .from('grades')
      .select(`
        *,
        students:student_id(name),
        subjects:subject_id(subject_name)
      `)
      .in('enrollment_id', enrollmentIds)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .eq('period', periodNum)
      .order('students(name)');

    if (error) throw error;
    return data || [];
  },

  async updateGrade(gradeId: string, updates: Partial<Grade>) {
    const { data, error } = await supabase
      .from('grades')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gradeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAttendance(filters: {
    tenantId: string;
    studentId?: string;
    enrollmentId?: string;
    subjectId?: string;
    academicYear: number;
    period?: number;
  }) {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('academic_year', filters.academicYear);

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.enrollmentId) {
      query = query.eq('enrollment_id', filters.enrollmentId);
    }

    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }

    if (filters.period) {
      query = query.eq('period', filters.period);
    }

    const { data, error } = await query.order('period', { ascending: true });

    if (error) throw error;
    
    // Buscar dados relacionados separadamente se necessário
    const attendance = (data || []) as any[];
    if (attendance.length > 0) {
      const studentIds = [...new Set(attendance.map(a => a.student_id).filter(Boolean))];
      const subjectIds = [...new Set(attendance.map(a => a.subject_id).filter(Boolean))];
      
      const [studentsResult, subjectsResult] = await Promise.all([
        studentIds.length > 0 
          ? supabase.from('students').select('id, name').in('id', studentIds)
          : Promise.resolve({ data: [], error: null }),
        subjectIds.length > 0
          ? supabase.from('subjects').select('id, subject_name').in('id', subjectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      
      const studentsMap = new Map((studentsResult.data || []).map((s: any) => [s.id, s.name]));
      const subjectsMap = new Map((subjectsResult.data || []).map((s: any) => [s.id, s.subject_name]));
      
      return attendance.map(att => ({
        ...att,
        student_name: studentsMap.get(att.student_id),
        subject_name: subjectsMap.get(att.subject_id),
      }));
    }
    
    return attendance;
  },

  async createAttendance(attendance: Partial<Attendance>) {
    const totalClasses = attendance.total_classes || 0;
    const presentClasses = attendance.present_classes || 0;
    const attendancePercentage = totalClasses > 0 
      ? (presentClasses / totalClasses) * 100 
      : 0;

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        student_id: attendance.student_id,
        enrollment_id: attendance.enrollment_id,
        subject_id: attendance.subject_id,
        academic_year: attendance.academic_year,
        period: attendance.period,
        total_classes: totalClasses,
        present_classes: presentClasses,
        absent_classes: attendance.absent_classes || 0,
        justified_absences: attendance.justified_absences || 0,
        attendance_percentage: attendancePercentage,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async calculateFinalGrade(
    grades: Grade[],
    config: EvaluationConfig
  ): Promise<number> {
    if (grades.length === 0) return 0;

    switch (config.calculation_method) {
      case 'arithmetic':
        const numericGrades = grades
          .map(g => g.grade_value)
          .filter((v): v is number => v !== null);
        return numericGrades.length > 0
          ? numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length
          : 0;

      case 'weighted':
        if (!config.weights) return 0;
        let weightedSum = 0;
        let totalWeight = 0;
        grades.forEach(grade => {
          if (grade.grade_value !== null) {
            const weight = config.weights![grade.period.toString()] || 1;
            weightedSum += grade.grade_value * weight;
            totalWeight += weight;
          }
        });
        return totalWeight > 0 ? weightedSum / totalWeight : 0;

      case 'bimester_average':
        // Média dos bimestres
        const bimesterGrades = grades
          .map(g => g.grade_value)
          .filter((v): v is number => v !== null);
        return bimesterGrades.length > 0
          ? bimesterGrades.reduce((sum, grade) => sum + grade, 0) / bimesterGrades.length
          : 0;

      default:
        return 0;
    }
  },

  async getDescriptiveReports(filters: {
    tenantId: string;
    studentId?: string;
    enrollmentId?: string;
    academicYear: number;
    period?: number;
  }) {
    let query = supabase
      .from('descriptive_reports')
      .select('*')
      .eq('academic_year', filters.academicYear);

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.enrollmentId) {
      query = query.eq('enrollment_id', filters.enrollmentId);
    }

    if (filters.period) {
      query = query.eq('period', filters.period);
    }

    const { data, error } = await query.order('period', { ascending: true });

    if (error) throw error;
    
    // Buscar dados relacionados separadamente se necessário
    const reports = (data || []) as any[];
    if (reports.length > 0) {
      const studentIds = [...new Set(reports.map(r => r.student_id).filter(Boolean))];
      const createdByIds = [...new Set(reports.map(r => r.created_by).filter(Boolean))];
      
      const [studentsResult, profilesResult] = await Promise.all([
        studentIds.length > 0 
          ? supabase.from('students').select('id, name').in('id', studentIds)
          : Promise.resolve({ data: [], error: null }),
        createdByIds.length > 0
          ? supabase.from('profiles').select('id, full_name').in('id', createdByIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      
      const studentsMap = new Map((studentsResult.data || []).map((s: any) => [s.id, s.name]));
      const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p.full_name]));
      
      return reports.map(report => ({
        ...report,
        student_name: studentsMap.get(report.student_id),
        created_by_name: profilesMap.get(report.created_by),
      }));
    }
    
    return reports;
  },

  async createDescriptiveReport(report: Partial<DescriptiveReport>) {
    const { data, error } = await supabase
      .from('descriptive_reports')
      .insert({
        student_id: report.student_id,
        enrollment_id: report.enrollment_id,
        academic_year: report.academic_year,
        period: report.period,
        report_text: report.report_text,
        created_by: report.created_by,
        diary_entry_id: report.diary_entry_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

