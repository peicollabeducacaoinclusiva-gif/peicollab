import { supabase } from '@pei/database';
import { evaluationService } from './evaluationService';

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: 'students' | 'academic' | 'attendance' | 'staff' | 'censo' | 'financial';
  parameters: ReportParameter[];
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface ReportResult {
  headers: string[];
  rows: any[][];
  summary?: Record<string, any>;
}

export const reportService = {
  // Definições de relatórios pré-configurados
  getReportDefinitions(): ReportDefinition[] {
    return [
      {
        id: 'students-by-class',
        name: 'Alunos por Turma',
        description: 'Lista todos os alunos agrupados por turma',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'attendance-report',
        name: 'Relatório de Frequência',
        description: 'Frequência dos alunos por período',
        category: 'attendance',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
          { name: 'period', label: 'Período', type: 'select', required: false, options: [
            { value: '1', label: '1º Bimestre' },
            { value: '2', label: '2º Bimestre' },
            { value: '3', label: '3º Bimestre' },
            { value: '4', label: '4º Bimestre' },
          ]},
        ],
      },
      {
        id: 'performance-report',
        name: 'Relatório de Desempenho',
        description: 'Desempenho acadêmico dos alunos',
        category: 'academic',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'subjectId', label: 'Disciplina', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'students-with-special-needs',
        name: 'Alunos com Necessidades Especiais',
        description: 'Lista alunos com NEE por tipo',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'neeType', label: 'Tipo de NEE', type: 'select', required: false },
        ],
      },
      {
        id: 'enrollment-report',
        name: 'Relatório de Matrículas',
        description: 'Estatísticas de matrículas por período',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
          { name: 'status', label: 'Status', type: 'select', required: false, options: [
            { value: 'active', label: 'Ativas' },
            { value: 'inactive', label: 'Inativas' },
            { value: 'transferred', label: 'Transferidas' },
          ]},
        ],
      },
      {
        id: 'staff-report',
        name: 'Relatório de Profissionais',
        description: 'Lista de profissionais por função',
        category: 'staff',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'role', label: 'Função', type: 'select', required: false },
        ],
      },
      {
        id: 'class-schedule-report',
        name: 'Horários das Turmas',
        description: 'Grade de horários por turma',
        category: 'academic',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'students-by-grade',
        name: 'Alunos por Série/Ano',
        description: 'Distribuição de alunos por série',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'low-attendance',
        name: 'Alunos com Baixa Frequência',
        description: 'Alunos com frequência abaixo de 75%',
        category: 'attendance',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
          { name: 'threshold', label: 'Limite (%)', type: 'number', required: false },
        ],
      },
      {
        id: 'failing-students',
        name: 'Alunos em Recuperação',
        description: 'Alunos com média abaixo da nota mínima',
        category: 'academic',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'subjectId', label: 'Disciplina', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'educacenso-export',
        name: 'Exportação Educacenso',
        description: 'Dados formatados para o Censo Escolar',
        category: 'censo',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'transfer-report',
        name: 'Relatório de Transferências',
        description: 'Alunos transferidos no período',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'dateStart', label: 'Data Inicial', type: 'date', required: false },
          { name: 'dateEnd', label: 'Data Final', type: 'date', required: false },
        ],
      },
      {
        id: 'subject-performance',
        name: 'Desempenho por Disciplina',
        description: 'Estatísticas de desempenho por disciplina',
        category: 'academic',
        parameters: [
          { name: 'subjectId', label: 'Disciplina', type: 'select', required: true },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'teacher-classes',
        name: 'Turmas por Professor',
        description: 'Distribuição de turmas por professor',
        category: 'staff',
        parameters: [
          { name: 'teacherId', label: 'Professor', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'students-age-distribution',
        name: 'Distribuição por Idade',
        description: 'Alunos agrupados por faixa etária',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
        ],
      },
      {
        id: 'monthly-attendance',
        name: 'Frequência Mensal',
        description: 'Frequência dos alunos por mês',
        category: 'attendance',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
          { name: 'month', label: 'Mês', type: 'select', required: false, options: [
            { value: '1', label: 'Janeiro' },
            { value: '2', label: 'Fevereiro' },
            { value: '3', label: 'Março' },
            { value: '4', label: 'Abril' },
            { value: '5', label: 'Maio' },
            { value: '6', label: 'Junho' },
            { value: '7', label: 'Julho' },
            { value: '8', label: 'Agosto' },
            { value: '9', label: 'Setembro' },
            { value: '10', label: 'Outubro' },
            { value: '11', label: 'Novembro' },
            { value: '12', label: 'Dezembro' },
          ]},
        ],
      },
      {
        id: 'final-grades',
        name: 'Notas Finais',
        description: 'Médias finais dos alunos',
        category: 'academic',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'students-by-shift',
        name: 'Alunos por Turno',
        description: 'Distribuição de alunos por turno',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'class-capacity',
        name: 'Capacidade das Turmas',
        description: 'Ocupação e capacidade das turmas',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'students-without-enrollment',
        name: 'Alunos sem Matrícula',
        description: 'Alunos ativos sem matrícula no ano letivo',
        category: 'students',
        parameters: [
          { name: 'schoolId', label: 'Escola', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
      {
        id: 'descriptive-reports-summary',
        name: 'Resumo de Pareceres',
        description: 'Pareceres descritivos por período',
        category: 'academic',
        parameters: [
          { name: 'classId', label: 'Turma', type: 'select', required: false },
          { name: 'academicYear', label: 'Ano Letivo', type: 'number', required: true },
        ],
      },
    ];
  },

  async generateReport(
    reportId: string,
    parameters: Record<string, any>,
    tenantId: string
  ): Promise<ReportResult> {
    const definition = this.getReportDefinitions().find(r => r.id === reportId);
    if (!definition) {
      throw new Error('Relatório não encontrado');
    }

    switch (reportId) {
      case 'students-by-class':
        return await this.generateStudentsByClass(parameters, tenantId);
      case 'attendance-report':
        return await this.generateAttendanceReport(parameters, tenantId);
      case 'performance-report':
        return await this.generatePerformanceReport(parameters, tenantId);
      case 'students-with-special-needs':
        return await this.generateStudentsWithSpecialNeeds(parameters, tenantId);
      case 'enrollment-report':
        return await this.generateEnrollmentReport(parameters, tenantId);
      case 'staff-report':
        return await this.generateStaffReport(parameters, tenantId);
      case 'class-schedule-report':
        return await this.generateClassScheduleReport(parameters, tenantId);
      case 'students-by-grade':
        return await this.generateStudentsByGrade(parameters, tenantId);
      case 'low-attendance':
        return await this.generateLowAttendance(parameters, tenantId);
      case 'failing-students':
        return await this.generateFailingStudents(parameters, tenantId);
      case 'educacenso-export':
        return await this.generateEducacensoExport(parameters, tenantId);
      case 'transfer-report':
        return await this.generateTransferReport(parameters, tenantId);
      case 'subject-performance':
        return await this.generateSubjectPerformance(parameters, tenantId);
      case 'teacher-classes':
        return await this.generateTeacherClasses(parameters, tenantId);
      case 'students-age-distribution':
        return await this.generateStudentsAgeDistribution(parameters, tenantId);
      case 'monthly-attendance':
        return await this.generateMonthlyAttendance(parameters, tenantId);
      case 'final-grades':
        return await this.generateFinalGrades(parameters, tenantId);
      case 'students-by-shift':
        return await this.generateStudentsByShift(parameters, tenantId);
      case 'class-capacity':
        return await this.generateClassCapacity(parameters, tenantId);
      case 'students-without-enrollment':
        return await this.generateStudentsWithoutEnrollment(parameters, tenantId);
      case 'descriptive-reports-summary':
        return await this.generateDescriptiveReportsSummary(parameters, tenantId);
      default:
        throw new Error('Relatório não implementado');
    }
  },

  async generateStudentsByClass(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    let query = supabase
      .from('student_enrollments')
      .select(`
        id,
        students:student_id(name, registration_number, date_of_birth),
        classes:class_id(class_name, grade, shift),
        schools:school_id(school_name)
      `)
      .eq('academic_year', parameters.academicYear || new Date().getFullYear())
      .eq('status', 'active');

    if (parameters.schoolId) {
      query = query.eq('school_id', parameters.schoolId);
    }

    const { data, error } = await query.order('class_id').order('students(name)');

    if (error) throw error;

    const rows = (data || []).map((enrollment: any) => [
      (enrollment.students as any)?.name || 'N/A',
      (enrollment.students as any)?.registration_number || '-',
      (enrollment.classes as any)?.class_name || '-',
      (enrollment.classes as any)?.grade || '-',
      (enrollment.classes as any)?.shift || '-',
      (enrollment.schools as any)?.school_name || '-',
    ]);

    return {
      headers: ['Nome', 'Matrícula', 'Turma', 'Série', 'Turno', 'Escola'],
      rows,
      summary: {
        total: rows.length,
        byClass: {},
      },
    };
  },

  async generateAttendanceReport(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    // Implementação simplificada - buscar frequência
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select('id, student_id, classes:class_id(class_name)')
      .eq('academic_year', parameters.academicYear || new Date().getFullYear())
      .eq('status', 'active');

    if (parameters.classId) {
      // Filtrar por turma se especificado
    }

    const rows: any[][] = [];
    for (const enrollment of enrollments || []) {
      const attendance = await evaluationService.getAttendance({
        tenantId,
        enrollmentId: enrollment.id,
        academicYear: parameters.academicYear,
        period: parameters.period ? parseInt(parameters.period) : undefined,
      });

      attendance.forEach(att => {
        rows.push([
          (enrollment.classes as any)?.class_name || '-',
          att.period.toString(),
          att.present_classes.toString(),
          att.total_classes.toString(),
          att.attendance_percentage.toFixed(1) + '%',
        ]);
      });
    }

    return {
      headers: ['Turma', 'Período', 'Presentes', 'Total', 'Frequência'],
      rows,
    };
  },

  async generatePerformanceReport(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    // Implementação simplificada
    return {
      headers: ['Aluno', 'Disciplina', 'Média', 'Status'],
      rows: [],
    };
  },

  async generateStudentsWithSpecialNeeds(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    let query = supabase
      .from('students')
      .select('id, name, tipo_necessidade, schools:school_id(school_name)')
      .eq('tenant_id', tenantId)
      .eq('necessidades_especiais', true)
      .eq('is_active', true);

    if (parameters.schoolId) {
      query = query.eq('school_id', parameters.schoolId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows = (data || []).map((student: any) => [
      student.name,
      (student.tipo_necessidade || []).join(', ') || '-',
      (student.schools as any)?.school_name || '-',
    ]);

    return {
      headers: ['Nome', 'Tipo de NEE', 'Escola'],
      rows,
    };
  },

  async generateEnrollmentReport(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    let query = supabase
      .from('student_enrollments')
      .select('id, status, enrollment_date, students:student_id(name), schools:school_id(school_name)')
      .eq('academic_year', parameters.academicYear || new Date().getFullYear());

    if (parameters.schoolId) {
      query = query.eq('school_id', parameters.schoolId);
    }

    if (parameters.status) {
      query = query.eq('status', parameters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows = (data || []).map((enrollment: any) => [
      (enrollment.students as any)?.name || 'N/A',
      enrollment.status,
      enrollment.enrollment_date || '-',
      (enrollment.schools as any)?.school_name || '-',
    ]);

    return {
      headers: ['Aluno', 'Status', 'Data de Matrícula', 'Escola'],
      rows,
      summary: {
        total: rows.length,
        byStatus: {},
      },
    };
  },

  async generateStaffReport(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    let query = supabase
      .from('professionals')
      .select('id, full_name, professional_role, schools:school_id(school_name)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (parameters.schoolId) {
      query = query.eq('school_id', parameters.schoolId);
    }

    if (parameters.role) {
      query = query.eq('professional_role', parameters.role);
    }

    const { data, error } = await query.order('full_name');

    if (error) throw error;

    const rows = (data || []).map((prof: any) => [
      prof.full_name,
      prof.professional_role,
      (prof.schools as any)?.school_name || '-',
    ]);

    return {
      headers: ['Nome', 'Função', 'Escola'],
      rows,
    };
  },

  // Implementações simplificadas para os outros relatórios
  async generateClassScheduleReport(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    return { headers: ['Turma', 'Dia', 'Horário', 'Disciplina', 'Professor'], rows: [] };
  },

  async generateStudentsByGrade(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    return { headers: ['Série', 'Quantidade'], rows: [] };
  },

  async generateLowAttendance(parameters: Record<string, any>, tenantId: string): Promise<ReportResult> {
    return { headers: ['Aluno', 'Turma', 'Frequência'], rows: [] };
  },

  async generateFailingStudents(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Aluno', 'Disciplina', 'Média'], rows: [] };
  },

  async generateEducacensoExport(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Código INEP', 'Nome', 'CPF', 'Data Nascimento'], rows: [] };
  },

  async generateTransferReport(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Aluno', 'Data', 'Origem', 'Destino'], rows: [] };
  },

  async generateSubjectPerformance(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Turma', 'Média', 'Aprovados', 'Reprovados'], rows: [] };
  },

  async generateTeacherClasses(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Professor', 'Turma', 'Disciplina'], rows: [] };
  },

  async generateStudentsAgeDistribution(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Faixa Etária', 'Quantidade'], rows: [] };
  },

  async generateMonthlyAttendance(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Mês', 'Aluno', 'Frequência'], rows: [] };
  },

  async generateFinalGrades(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Aluno', 'Disciplina', 'Média Final'], rows: [] };
  },

  async generateStudentsByShift(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Turno', 'Quantidade'], rows: [] };
  },

  async generateClassCapacity(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Turma', 'Capacidade', 'Ocupação', 'Vagas'], rows: [] };
  },

  async generateStudentsWithoutEnrollment(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Aluno', 'Escola'], rows: [] };
  },

  async generateDescriptiveReportsSummary(_parameters: Record<string, any>, _tenantId: string): Promise<ReportResult> {
    return { headers: ['Aluno', 'Período', 'Parecer'], rows: [] };
  },
};

