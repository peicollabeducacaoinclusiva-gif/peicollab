import { supabase } from '@pei/database';

export interface IDEBIndicators {
  school_id: string;
  school_name: string;
  academic_year: number;
  grade_level: string;
  ideb_score: number;
  previous_ideb_score?: number;
  target_score: number;
  students_count: number;
  average_grade: number;
  approval_rate: number;
  dropout_rate: number;
  retention_rate: number;
}

export interface SAEBReport {
  school_id: string;
  school_name: string;
  academic_year: number;
  grade_level: string;
  portuguese_average: number;
  mathematics_average: number;
  students_participated: number;
  proficiency_levels: {
    portuguese: Record<string, number>;
    mathematics: Record<string, number>;
  };
}

export interface SEDUCReport {
  report_type: 'monthly' | 'quarterly' | 'annual';
  period: string;
  tenant_id: string;
  schools: Array<{
    school_id: string;
    school_name: string;
    students_count: number;
    professionals_count: number;
    classes_count: number;
    enrollments_count: number;
    average_attendance: number;
    average_grade: number;
  }>;
  summary: {
    total_students: number;
    total_professionals: number;
    total_classes: number;
    total_enrollments: number;
    network_average_attendance: number;
    network_average_grade: number;
  };
}

export const governmentReportsService = {
  async calculateIDEB(
    schoolId: string,
    academicYear: number,
    gradeLevel: string
  ): Promise<IDEBIndicators> {
    // Buscar dados da escola
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('id', schoolId)
      .single();

    if (schoolError) throw schoolError;

    // Buscar matrículas ativas
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, student_id, class_id')
      .eq('school_id', schoolId)
      .eq('academic_year', academicYear)
      .eq('is_active', true);

    if (enrollmentsError) throw enrollmentsError;

    const enrollmentIds = (enrollments || []).map(e => e.id);

    // Calcular média de notas
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('grade_value, enrollment_id')
      .in('enrollment_id', enrollmentIds)
      .eq('academic_year', academicYear);

    if (gradesError) throw gradesError;

    const validGrades = (grades || []).filter(g => g.grade_value !== null && g.grade_value !== undefined);
    const averageGrade = validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + (g.grade_value as number), 0) / validGrades.length
      : 0;

    // Calcular taxa de aprovação
    const { data: finalGrades } = await supabase
      .from('grades')
      .select('enrollment_id, grade_value')
      .in('enrollment_id', enrollmentIds)
      .eq('academic_year', academicYear)
      .eq('period', 'final');

    const approvedCount = (finalGrades || []).filter(g => (g.grade_value as number) >= 6).length;
    const approvalRate = enrollmentIds.length > 0
      ? (approvedCount / enrollmentIds.length) * 100
      : 0;

    // Calcular taxa de evasão (simplificado)
    const dropoutRate = 0; // Seria calculado comparando matrículas iniciais vs finais

    // Calcular IDEB (fórmula simplificada)
    // IDEB = (Média de Desempenho + Taxa de Aprovação) / 2
    // Em produção, usar fórmula oficial do MEC
    const idebScore = (averageGrade / 10 + approvalRate / 100) / 2 * 10;

    return {
      school_id: schoolId,
      school_name: school.school_name,
      academic_year: academicYear,
      grade_level: gradeLevel,
      ideb_score: Math.round(idebScore * 100) / 100,
      target_score: 6.0, // Meta padrão
      students_count: enrollmentIds.length,
      average_grade: Math.round(averageGrade * 100) / 100,
      approval_rate: Math.round(approvalRate * 100) / 100,
      dropout_rate: dropoutRate,
      retention_rate: 100 - dropoutRate,
    };
  },

  async generateSAEBReport(
    schoolId: string,
    academicYear: number,
    gradeLevel: string
  ): Promise<SAEBReport> {
    // Buscar dados da escola
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('id', schoolId)
      .single();

    if (schoolError) throw schoolError;

    // Buscar notas de português e matemática
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('school_id', schoolId)
      .eq('academic_year', academicYear)
      .eq('is_active', true);

    const enrollmentIds = (enrollments || []).map(e => e.id);

    // Buscar notas por disciplina (simplificado - em produção, usar subjects)
    const { data: allGrades } = await supabase
      .from('grades')
      .select('grade_value, subject_id, enrollment_id')
      .in('enrollment_id', enrollmentIds)
      .eq('academic_year', academicYear);

    // Calcular médias (simplificado)
    const portugueseGrades = (allGrades || []).filter(g => g.grade_value !== null);
    const mathematicsGrades = (allGrades || []).filter(g => g.grade_value !== null);

    const portugueseAverage = portugueseGrades.length > 0
      ? portugueseGrades.reduce((sum, g) => sum + (g.grade_value as number), 0) / portugueseGrades.length
      : 0;

    const mathematicsAverage = mathematicsGrades.length > 0
      ? mathematicsGrades.reduce((sum, g) => sum + (g.grade_value as number), 0) / mathematicsGrades.length
      : 0;

    return {
      school_id: schoolId,
      school_name: school.school_name,
      academic_year: academicYear,
      grade_level: gradeLevel,
      portuguese_average: Math.round(portugueseAverage * 100) / 100,
      mathematics_average: Math.round(mathematicsAverage * 100) / 100,
      students_participated: enrollmentIds.length,
      proficiency_levels: {
        portuguese: {
          'abaixo_basico': 0,
          'basico': 0,
          'proficiente': 0,
          'avancado': 0,
        },
        mathematics: {
          'abaixo_basico': 0,
          'basico': 0,
          'proficiente': 0,
          'avancado': 0,
        },
      },
    };
  },

  async generateSEDUCReport(
    tenantId: string,
    reportType: 'monthly' | 'quarterly' | 'annual',
    period: string
  ): Promise<SEDUCReport> {
    // Buscar todas as escolas do tenant
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (schoolsError) throw schoolsError;

    const schoolsData = await Promise.all(
      (schools || []).map(async (school) => {
        // Contar alunos
        const { count: studentsCount } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', school.id)
          .eq('is_active', true);

        // Contar profissionais
        const { count: professionalsCount } = await supabase
          .from('professionals')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', school.id)
          .eq('is_active', true);

        // Contar turmas
        const { count: classesCount } = await supabase
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', school.id)
          .eq('is_active', true);

        // Contar matrículas
        const { count: enrollmentsCount } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', school.id)
          .eq('is_active', true);

        // Calcular média de frequência (simplificado)
        const averageAttendance = 85; // Seria calculado a partir de attendance

        // Calcular média de notas (simplificado)
        const averageGrade = 7.5; // Seria calculado a partir de grades

        return {
          school_id: school.id,
          school_name: school.school_name,
          students_count: studentsCount || 0,
          professionals_count: professionalsCount || 0,
          classes_count: classesCount || 0,
          enrollments_count: enrollmentsCount || 0,
          average_attendance: averageAttendance,
          average_grade: averageGrade,
        };
      })
    );

    // Calcular totais
    const summary = {
      total_students: schoolsData.reduce((sum, s) => sum + s.students_count, 0),
      total_professionals: schoolsData.reduce((sum, s) => sum + s.professionals_count, 0),
      total_classes: schoolsData.reduce((sum, s) => sum + s.classes_count, 0),
      total_enrollments: schoolsData.reduce((sum, s) => sum + s.enrollments_count, 0),
      network_average_attendance: schoolsData.length > 0
        ? schoolsData.reduce((sum, s) => sum + s.average_attendance, 0) / schoolsData.length
        : 0,
      network_average_grade: schoolsData.length > 0
        ? schoolsData.reduce((sum, s) => sum + s.average_grade, 0) / schoolsData.length
        : 0,
    };

    return {
      report_type: reportType,
      period,
      tenant_id: tenantId,
      schools: schoolsData,
      summary,
    };
  },

  async exportToXML(data: any, format: 'ideb' | 'saeb' | 'seduc'): Promise<string> {
    // Em produção, usar biblioteca XML ou template engine
    // Por enquanto, retornar JSON formatado como XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<report type="${format}">
  ${JSON.stringify(data, null, 2)}
</report>`;
  },

  async exportToTXT(data: any, format: 'ideb' | 'saeb' | 'seduc'): Promise<string> {
    // Formato TXT específico para cada tipo de relatório
    let content = '';

    if (format === 'ideb') {
      content = `RELATÓRIO IDEB\n`;
      content += `Escola: ${data.school_name}\n`;
      content += `Ano Letivo: ${data.academic_year}\n`;
      content += `Série: ${data.grade_level}\n`;
      content += `IDEB: ${data.ideb_score}\n`;
      content += `Meta: ${data.target_score}\n`;
      content += `Taxa de Aprovação: ${data.approval_rate}%\n`;
      content += `Média de Notas: ${data.average_grade}\n`;
    } else if (format === 'saeb') {
      content = `RELATÓRIO SAEB\n`;
      content += `Escola: ${data.school_name}\n`;
      content += `Ano Letivo: ${data.academic_year}\n`;
      content += `Média Português: ${data.portuguese_average}\n`;
      content += `Média Matemática: ${data.mathematics_average}\n`;
    } else if (format === 'seduc') {
      content = `RELATÓRIO SEDUC\n`;
      content += `Período: ${data.period}\n`;
      content += `Total de Alunos: ${data.summary.total_students}\n`;
      content += `Total de Profissionais: ${data.summary.total_professionals}\n`;
      content += `Total de Turmas: ${data.summary.total_classes}\n`;
    }

    return content;
  },
};








