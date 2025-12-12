import { useState, useEffect } from 'react';
import { FileText, School, Award, TrendingUp, Clock } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { StudentReport } from '../components/StudentReport';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { evaluationService, type Grade, type Attendance, type DescriptiveReport } from '../services/evaluationService';
import { supabase } from '@pei/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface StudentEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  academic_year: number;
  grade: string;
  shift: string;
  status: string;
  enrollment_date: string;
  class_name?: string;
  school_name?: string;
}

interface StudentAcademicHistory {
  student: {
    id: string;
    name: string;
    date_of_birth?: string;
    registration_number?: string;
  };
  enrollments: StudentEnrollment[];
  grades: Grade[];
  attendance: Attendance[];
  reports: DescriptiveReport[];
}

export default function StudentHistory() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');

  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<Array<{ id: string; name: string; registration_number?: string }>>([]);
  const [history, setHistory] = useState<StudentAcademicHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [academicYear] = useState<number>(new Date().getFullYear());
  const [selectedYearForReport, setSelectedYearForReport] = useState<number | null>(null);

  useEffect(() => {
    if (selectedSchool && userProfile?.tenant_id) {
      loadStudents();
    }
  }, [selectedSchool, userProfile]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentHistory();
    }
  }, [selectedStudent, academicYear]);

  async function loadStudents() {
    if (!selectedSchool || !userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, student_id, registration_number')
        .eq('school_id', selectedSchool)
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStudents((data || []) as Array<{ id: string; name: string; registration_number?: string }>);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos');
    }
  }

  async function loadStudentHistory() {
    if (!selectedStudent || !userProfile?.tenant_id) return;

    try {
      setLoading(true);

      // Buscar dados do aluno
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, date_of_birth, student_id, registration_number')
        .eq('id', selectedStudent)
        .single();

      if (studentError) throw studentError;

      // Buscar matrículas
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          class_id,
          academic_year,
          grade,
          shift,
          status,
          enrollment_date,
          classes:class_id(class_name),
          schools:school_id(school_name)
        `)
        .eq('student_id', selectedStudent)
        .order('academic_year', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      const enrollments: StudentEnrollment[] = (enrollmentsData || []).map((e: any) => ({
        id: e.id,
        student_id: e.student_id,
        class_id: e.class_id,
        academic_year: e.academic_year,
        grade: e.grade,
        shift: e.shift,
        status: e.status,
        enrollment_date: e.enrollment_date,
        class_name: e.classes?.class_name,
        school_name: e.schools?.school_name,
      }));

      // Buscar todas as notas
      const allGrades: Grade[] = [];
      for (const enrollment of enrollments) {
        const grades = await evaluationService.getGrades({
          tenantId: userProfile.tenant_id,
          enrollmentId: enrollment.id,
          academicYear: enrollment.academic_year,
        });
        allGrades.push(...grades);
      }

      // Buscar frequência
      const allAttendance: Attendance[] = [];
      for (const enrollment of enrollments) {
        const attendance = await evaluationService.getAttendance({
          tenantId: userProfile.tenant_id,
          enrollmentId: enrollment.id,
          academicYear: enrollment.academic_year,
        });
        allAttendance.push(...attendance);
      }

      // Buscar pareceres descritivos
      const allReports: DescriptiveReport[] = [];
      for (const enrollment of enrollments) {
        const reports = await evaluationService.getDescriptiveReports({
          tenantId: userProfile.tenant_id,
          enrollmentId: enrollment.id,
          academicYear: enrollment.academic_year,
        });
        allReports.push(...reports);
      }

      setHistory({
        student: studentData,
        enrollments,
        grades: allGrades,
        attendance: allAttendance,
        reports: allReports,
      });
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico do aluno');
    } finally {
      setLoading(false);
    }
  }

  const getGradesByYear = (year: number) => {
    return history?.grades.filter(g => {
      const enrollment = history.enrollments.find(e => e.academic_year === year);
      return enrollment && g.enrollment_id === enrollment.id;
    }) || [];
  };

  const getAttendanceByYear = (year: number) => {
    return history?.attendance.filter(a => {
      const enrollment = history.enrollments.find(e => e.academic_year === year);
      return enrollment && a.enrollment_id === enrollment.id;
    }) || [];
  };

  const getReportsByYear = (year: number) => {
    return history?.reports.filter(r => {
      const enrollment = history.enrollments.find(e => e.academic_year === year);
      return enrollment && r.enrollment_id === enrollment.id;
    }) || [];
  };

  const calculateAverage = (grades: Grade[]) => {
    const numericGrades = grades
      .map(g => g.grade_value)
      .filter((v): v is number => v !== null);
    if (numericGrades.length === 0) return null;
    return numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length;
  };

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (userProfile.tenant as any)?.network_name || null,
    school_name: (userProfile.school as any)?.school_name || null,
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Gestão Escolar"
        appLogo="/logo.png"
        currentApp="gestao-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Histórico Escolar</h1>
          <p className="text-muted-foreground mt-1">
            Visualize o histórico completo de um aluno
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selecionar Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="school">Escola</Label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger id="school">
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolsData.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="student">Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} {student.registration_number && `(${student.registration_number})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico do Aluno */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        ) : history ? (
          <div className="space-y-6">
            {/* Informações do Aluno */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações do Aluno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome Completo</Label>
                    <p className="font-semibold">{history.student.name}</p>
                  </div>
                  {history.student.date_of_birth && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Data de Nascimento</Label>
                      <p className="font-semibold">
                        {format(new Date(history.student.date_of_birth), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {history.student.registration_number && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Matrícula</Label>
                      <p className="font-semibold">{history.student.registration_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Relatório Completo */}
            {selectedYearForReport && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Relatório Completo - {selectedYearForReport}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedYearForReport(null)}>
                      Fechar Relatório
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const enrollment = history.enrollments.find(e => e.academic_year === selectedYearForReport);
                    if (!enrollment) return null;

                    const yearGrades = getGradesByYear(selectedYearForReport);
                    const yearAttendance = getAttendanceByYear(selectedYearForReport);
                    const yearReports = getReportsByYear(selectedYearForReport);

                    return (
                      <StudentReport
                        student={history.student}
                        enrollment={enrollment}
                        grades={yearGrades}
                        attendance={yearAttendance}
                        reports={yearReports}
                      />
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Histórico por Ano Letivo */}
            <Tabs defaultValue={history.enrollments[0]?.academic_year?.toString() || ''} className="space-y-4">
              <TabsList>
                {history.enrollments.map((enrollment) => (
                  <TabsTrigger key={enrollment.id} value={enrollment.academic_year.toString()}>
                    {enrollment.academic_year}
                  </TabsTrigger>
                ))}
              </TabsList>

              {history.enrollments.map((enrollment) => {
                const yearGrades = getGradesByYear(enrollment.academic_year);
                const yearAttendance = getAttendanceByYear(enrollment.academic_year);
                const yearReports = getReportsByYear(enrollment.academic_year);
                const average = calculateAverage(yearGrades);

                return (
                  <TabsContent key={enrollment.id} value={enrollment.academic_year.toString()} className="space-y-4">
                    {/* Botão para ver relatório completo */}
                    {!selectedYearForReport && (
                      <Card>
                        <CardContent className="pt-6">
                          <Button
                            onClick={() => setSelectedYearForReport(enrollment.academic_year)}
                            className="w-full"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Relatório Completo
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Informações da Matrícula */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <School className="h-5 w-5" />
                          Matrícula {enrollment.academic_year}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Turma</Label>
                            <p className="font-semibold">{enrollment.class_name || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Série/Ano</Label>
                            <p className="font-semibold">{enrollment.grade || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Turno</Label>
                            <p className="font-semibold">{enrollment.shift || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Status</Label>
                            <Badge
                              className={
                                enrollment.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              }
                            >
                              {enrollment.status === 'active' ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Desempenho */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Desempenho Acadêmico
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {average !== null && (
                          <div className="mb-4 p-4 bg-muted rounded-lg">
                            <Label className="text-sm text-muted-foreground">Média Geral</Label>
                            <p className="text-3xl font-bold">{average.toFixed(1)}</p>
                          </div>
                        )}
                        {yearGrades.length > 0 ? (
                          <div className="space-y-2">
                            {yearGrades.map((grade) => (
                              <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{(grade as any).subjects?.subject_name || 'Disciplina'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {grade.period}º Bimestre
                                  </p>
                                </div>
                                <div className="text-right">
                                  {grade.grade_value !== null && (
                                    <p className="text-lg font-bold">{grade.grade_value.toFixed(1)}</p>
                                  )}
                                  {grade.conceptual_grade && (
                                    <Badge>{grade.conceptual_grade}</Badge>
                                  )}
                                  {grade.descriptive_grade && (
                                    <p className="text-sm text-muted-foreground max-w-md truncate">
                                      {grade.descriptive_grade}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            Nenhuma nota registrada para este ano letivo
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Frequência */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Frequência
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {yearAttendance.length > 0 ? (
                          <div className="space-y-2">
                            {yearAttendance.map((att) => (
                              <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">
                                    {(att as any).subjects?.subject_name || 'Frequência Geral'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {att.period}º Bimestre
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    {att.present_classes}/{att.total_classes} aulas
                                  </p>
                                  <p
                                    className={`font-bold ${
                                      att.attendance_percentage >= 75
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {att.attendance_percentage.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            Nenhuma frequência registrada para este ano letivo
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pareceres Descritivos */}
                    {yearReports.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Pareceres Descritivos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {yearReports.map((report) => (
                              <Card key={report.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    {report.period}º Bimestre - {report.academic_year}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="whitespace-pre-wrap">{report.report_text}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Criado em{' '}
                                    {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Selecione um aluno para visualizar o histórico escolar
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

