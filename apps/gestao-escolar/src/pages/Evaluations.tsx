import { useState, useEffect } from 'react';
import { BookOpen, Settings, FileText, Calendar, Plus } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { evaluationService, type EvaluationConfig, type Grade, type Attendance, type DescriptiveReport } from '../services/evaluationService';
import { supabase } from '@pei/database';
import { toast } from 'sonner';

export default function Evaluations() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1');

  const [evaluationConfig, setEvaluationConfig] = useState<EvaluationConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<DescriptiveReport[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; subject_name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; enrollment_id?: string }>>([]);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [gradeValue, setGradeValue] = useState<string>('');
  const [conceptualGrade, setConceptualGrade] = useState<string>('');
  const [descriptiveGrade, setDescriptiveGrade] = useState<string>('');
  const [totalClasses, setTotalClasses] = useState<string>('');
  const [presentClasses, setPresentClasses] = useState<string>('');
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadEvaluationConfig();
      loadSubjects();
    }
  }, [userProfile, academicYear, selectedSchool]);

  useEffect(() => {
    if (selectedClass && userProfile?.tenant_id) {
      loadStudents();
    }
  }, [selectedClass, academicYear]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod) {
      loadGrades();
      loadAttendance();
      loadReports();
    }
  }, [selectedClass, selectedSubject, selectedPeriod, academicYear]);

  async function loadEvaluationConfig() {
    if (!userProfile?.tenant_id) return;

    try {
      const config = await evaluationService.getEvaluationConfig(
        userProfile.tenant_id,
        userProfile.school_id || undefined,
        academicYear
      );
      setEvaluationConfig(config as EvaluationConfig | null);
    } catch (error: any) {
      console.error('Erro ao carregar configuração:', error);
    }
  }

  async function loadSubjects() {
    if (!userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  }

  async function loadStudents() {
    if (!selectedClass || !userProfile?.tenant_id) return;

    try {
      const { data: enrollments, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          students:student_id(name)
        `)
        .eq('class_id', selectedClass)
        .eq('academic_year', academicYear)
        .eq('status', 'active');

      if (error) throw error;

      setStudents(
        (enrollments || []).map((e: any) => ({
          id: e.student_id,
          name: e.students?.name || 'N/A',
          enrollment_id: e.id,
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
    }
  }

  async function loadGrades() {
    if (!selectedClass || !selectedSubject || !selectedPeriod || !userProfile?.tenant_id) return;

    try {
      const enrollmentIds = students.map(s => s.enrollment_id).filter((id): id is string => !!id);
      if (enrollmentIds.length === 0) return;

      const allGrades: Grade[] = [];
      for (const enrollmentId of enrollmentIds) {
        const grades = await evaluationService.getGrades({
          tenantId: userProfile.tenant_id,
          enrollmentId,
          subjectId: selectedSubject,
          academicYear,
          period: parseInt(selectedPeriod),
        });
        allGrades.push(...(grades as unknown as Grade[]));
      }

      setGrades(allGrades as unknown as Grade[]);
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
    }
  }

  async function loadAttendance() {
    if (!selectedClass || !selectedPeriod || !userProfile?.tenant_id) return;

    try {
      const enrollmentIds = students.map(s => s.enrollment_id).filter((id): id is string => !!id);
      if (enrollmentIds.length === 0) return;

      const allAttendance: Attendance[] = [];
      for (const enrollmentId of enrollmentIds) {
        const att = await evaluationService.getAttendance({
          tenantId: userProfile.tenant_id,
          enrollmentId,
          subjectId: selectedSubject || undefined,
          academicYear,
          period: parseInt(selectedPeriod),
        });
        allAttendance.push(...(att as unknown as Attendance[]));
      }

      setAttendance(allAttendance as unknown as Attendance[]);
    } catch (error: any) {
      console.error('Erro ao carregar frequência:', error);
    }
  }

  async function loadReports() {
    if (!selectedClass || !selectedPeriod || !userProfile?.tenant_id) return;

    try {
      const enrollmentIds = students.map(s => s.enrollment_id).filter((id): id is string => !!id);
      if (enrollmentIds.length === 0) return;

      const allReports: DescriptiveReport[] = [];
      for (const enrollmentId of enrollmentIds) {
        const reports = await evaluationService.getDescriptiveReports({
          tenantId: userProfile.tenant_id,
          enrollmentId,
          academicYear,
          period: parseInt(selectedPeriod),
        });
        allReports.push(...(reports as unknown as DescriptiveReport[]));
      }

      setReports(allReports as unknown as DescriptiveReport[]);
    } catch (error: any) {
      console.error('Erro ao carregar pareceres:', error);
    }
  }

  async function handleSaveConfig() {
    if (!userProfile?.tenant_id) return;

    try {
      if (evaluationConfig?.id) {
        await evaluationService.updateEvaluationConfig(evaluationConfig.id, evaluationConfig);
        toast.success('Configuração atualizada com sucesso');
      } else {
        const newConfig = await evaluationService.createEvaluationConfig({
          evaluation_type: 'numeric',
          calculation_method: 'arithmetic',
          passing_grade: 6.0,
          max_grade: 10.0,
          tenant_id: userProfile.tenant_id,
          school_id: userProfile.school_id || undefined,
          academic_year: academicYear,
        });
        setEvaluationConfig(newConfig as EvaluationConfig | null);
        toast.success('Configuração criada com sucesso');
      }
      setConfigDialogOpen(false);
      await loadEvaluationConfig();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configuração');
    }
  }

  async function handleSaveGrade() {
    if (!selectedStudent || !selectedSubject || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const student = students.find(s => s.id === selectedStudent);
    if (!student?.enrollment_id) {
      toast.error('Aluno não encontrado');
      return;
    }

    try {
      const evaluationType = evaluationConfig?.evaluation_type || 'numeric';
      let gradeValueNum: number | null = null;

      if (evaluationType === 'numeric') {
        gradeValueNum = parseFloat(gradeValue);
        if (isNaN(gradeValueNum)) {
          toast.error('Nota inválida');
          return;
        }
      }

      await evaluationService.createGrade({
        student_id: selectedStudent,
        enrollment_id: student.enrollment_id,
        subject_id: selectedSubject,
        academic_year: academicYear,
        period: parseInt(selectedPeriod),
        grade_value: gradeValueNum,
        conceptual_grade: evaluationType === 'conceptual' ? conceptualGrade : undefined,
        descriptive_grade: evaluationType === 'descriptive' ? descriptiveGrade : undefined,
        evaluation_type: evaluationType,
      });

      toast.success('Nota lançada com sucesso');
      setGradeDialogOpen(false);
      setSelectedStudent('');
      setGradeValue('');
      setConceptualGrade('');
      setDescriptiveGrade('');
      await loadGrades();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao lançar nota');
    }
  }

  async function handleSaveAttendance() {
    if (!selectedStudent || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const student = students.find(s => s.id === selectedStudent);
    if (!student?.enrollment_id) {
      toast.error('Aluno não encontrado');
      return;
    }

    try {
      const total = parseInt(totalClasses);
      const present = parseInt(presentClasses);

      if (isNaN(total) || isNaN(present) || present > total) {
        toast.error('Valores de frequência inválidos');
        return;
      }

      await evaluationService.createAttendance({
        student_id: selectedStudent,
        enrollment_id: student.enrollment_id,
        subject_id: selectedSubject || undefined,
        academic_year: academicYear,
        period: parseInt(selectedPeriod),
        total_classes: total,
        present_classes: present,
        absent_classes: total - present,
      });

      toast.success('Frequência registrada com sucesso');
      setAttendanceDialogOpen(false);
      setSelectedStudent('');
      setTotalClasses('');
      setPresentClasses('');
      await loadAttendance();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar frequência');
    }
  }

  async function handleSaveReport() {
    if (!selectedStudent || !reportText.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const student = students.find(s => s.id === selectedStudent);
    if (!student?.enrollment_id) {
      toast.error('Aluno não encontrado');
      return;
    }

    try {
      await evaluationService.createDescriptiveReport({
        student_id: selectedStudent,
        enrollment_id: student.enrollment_id,
        academic_year: academicYear,
        period: parseInt(selectedPeriod),
        report_text: reportText,
        created_by: user.id,
      });

      toast.success('Parecer descritivo criado com sucesso');
      setReportDialogOpen(false);
      setSelectedStudent('');
      setReportText('');
      await loadReports();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar parecer');
    }
  }

  const filteredClasses = classesData?.data?.filter(
    cls => !selectedSchool || cls.school_id === selectedSchool
  ) || [];

  const appUserProfile: AppUserProfile | undefined = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (typeof userProfile.tenant === 'object' && userProfile.tenant !== null && 'network_name' in userProfile.tenant) ? (userProfile.tenant as any).network_name : null,
    school_name: (typeof userProfile.school === 'object' && userProfile.school !== null && 'school_name' in userProfile.school) ? (userProfile.school as any).school_name : null,
  } as AppUserProfile : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Gestão Escolar"
        appLogo="/logo.png"
        currentApp="gestao-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sistema de Avaliação</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie avaliações, notas e frequência dos alunos
            </p>
          </div>
          <Button onClick={() => setConfigDialogOpen(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar Sistema
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="academicYear">Ano Letivo</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
              <div>
                <Label htmlFor="school">Escola</Label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger id="school">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {schoolsData.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="class">Turma</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Disciplina</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period">Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Bimestre</SelectItem>
                    <SelectItem value="2">2º Bimestre</SelectItem>
                    <SelectItem value="3">3º Bimestre</SelectItem>
                    <SelectItem value="4">4º Bimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de funcionalidades */}
        <Tabs defaultValue="grades" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grades">
              <BookOpen className="h-4 w-4 mr-2" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Calendar className="h-4 w-4 mr-2" />
              Frequência
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Pareceres Descritivos
            </TabsTrigger>
          </TabsList>

          {/* Notas */}
          <TabsContent value="grades">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notas dos Alunos</CardTitle>
                <Button onClick={() => setGradeDialogOpen(true)} disabled={!selectedClass || !selectedSubject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Lançar Nota
                </Button>
              </CardHeader>
              <CardContent>
                {!selectedClass || !selectedSubject ? (
                  <p className="text-muted-foreground text-center py-8">
                    Selecione uma turma e disciplina para visualizar as notas
                  </p>
                ) : students.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum aluno encontrado nesta turma
                  </p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => {
                      const studentGrade = grades.find(
                        g => g.student_id === student.id && g.subject_id === selectedSubject
                      );
                      return (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-lg font-bold">
                            {studentGrade
                              ? evaluationConfig?.evaluation_type === 'numeric'
                                ? studentGrade.grade_value?.toFixed(1) || '-'
                                : studentGrade.conceptual_grade || studentGrade.descriptive_grade || '-'
                              : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frequência */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Frequência dos Alunos</CardTitle>
                <Button onClick={() => setAttendanceDialogOpen(true)} disabled={!selectedClass}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Frequência
                </Button>
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                  <p className="text-muted-foreground text-center py-8">
                    Selecione uma turma para visualizar a frequência
                  </p>
                ) : students.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum aluno encontrado nesta turma
                  </p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => {
                      const studentAttendance = attendance.find(a => a.student_id === student.id);
                      return (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium">{student.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {studentAttendance
                                ? `${studentAttendance.present_classes}/${studentAttendance.total_classes} aulas`
                                : '-'}
                            </span>
                            <span className={`font-bold ${
                              studentAttendance && studentAttendance.attendance_percentage >= 75
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {studentAttendance
                                ? `${studentAttendance.attendance_percentage.toFixed(1)}%`
                                : '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pareceres Descritivos */}
          <TabsContent value="reports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pareceres Descritivos</CardTitle>
                <Button onClick={() => setReportDialogOpen(true)} disabled={!selectedClass}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Parecer
                </Button>
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                  <p className="text-muted-foreground text-center py-8">
                    Selecione uma turma para visualizar os pareceres
                  </p>
                ) : reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum parecer descritivo encontrado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card key={report.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {(report as any).students?.name || 'Aluno'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap">{report.report_text}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Configuração */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuração do Sistema de Avaliação</DialogTitle>
            <DialogDescription>
              Configure o tipo de avaliação e método de cálculo de médias
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              <div>
                <Label>Tipo de Avaliação</Label>
                <Select
                  value={evaluationConfig?.evaluation_type || 'numeric'}
                  onValueChange={(value: any) =>
                    setEvaluationConfig({
                      ...(evaluationConfig || {
                        evaluation_type: 'numeric',
                        calculation_method: 'arithmetic',
                        passing_grade: 6.0,
                        max_grade: 10.0,
                      }),
                      evaluation_type: value,
                    } as EvaluationConfig)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric">Numérica (0-10)</SelectItem>
                    <SelectItem value="conceptual">Conceitual (A, B, C, D, E)</SelectItem>
                    <SelectItem value="descriptive">Descritiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Método de Cálculo</Label>
                <Select
                  value={evaluationConfig?.calculation_method || 'arithmetic'}
                  onValueChange={(value: any) =>
                    setEvaluationConfig({
                      ...(evaluationConfig || {
                        evaluation_type: 'numeric',
                        calculation_method: 'arithmetic',
                        passing_grade: 6.0,
                        max_grade: 10.0,
                      }),
                      calculation_method: value,
                    } as EvaluationConfig)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arithmetic">Média Aritmética</SelectItem>
                    <SelectItem value="weighted">Média Ponderada</SelectItem>
                    <SelectItem value="bimester_average">Média dos Bimestres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nota Mínima para Aprovação</Label>
                  <Input
                    type="number"
                    value={evaluationConfig?.passing_grade || 6.0}
                    onChange={(e) =>
                      setEvaluationConfig({
                        ...(evaluationConfig || {
                          evaluation_type: 'numeric',
                          calculation_method: 'arithmetic',
                          passing_grade: 6.0,
                          max_grade: 10.0,
                        }),
                        passing_grade: parseFloat(e.target.value) || 6.0,
                      } as EvaluationConfig)
                    }
                  />
                </div>
                <div>
                  <Label>Nota Máxima</Label>
                  <Input
                    type="number"
                    value={evaluationConfig?.max_grade || 10.0}
                    onChange={(e) =>
                      setEvaluationConfig({
                        ...(evaluationConfig || {
                          evaluation_type: 'numeric',
                          calculation_method: 'arithmetic',
                          passing_grade: 6.0,
                          max_grade: 10.0,
                        }),
                        max_grade: parseFloat(e.target.value) || 10.0,
                      } as EvaluationConfig)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig}>Salvar Configuração</Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Lançar Nota */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aluno</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {evaluationConfig?.evaluation_type === 'numeric' && (
              <div>
                <Label>Nota (0-{evaluationConfig.max_grade})</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max={evaluationConfig.max_grade}
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                />
              </div>
            )}
            {evaluationConfig?.evaluation_type === 'conceptual' && (
              <div>
                <Label>Conceito</Label>
                <Select value={conceptualGrade} onValueChange={setConceptualGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o conceito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excelente</SelectItem>
                    <SelectItem value="B">B - Bom</SelectItem>
                    <SelectItem value="C">C - Regular</SelectItem>
                    <SelectItem value="D">D - Insuficiente</SelectItem>
                    <SelectItem value="E">E - Muito Insuficiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {evaluationConfig?.evaluation_type === 'descriptive' && (
              <div>
                <Label>Avaliação Descritiva</Label>
                <Textarea
                  value={descriptiveGrade}
                  onChange={(e) => setDescriptiveGrade(e.target.value)}
                  rows={4}
                  placeholder="Descreva o desempenho do aluno..."
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGrade}>Salvar Nota</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Frequência */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Frequência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aluno</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total de Aulas</Label>
                <Input
                  type="number"
                  value={totalClasses}
                  onChange={(e) => setTotalClasses(e.target.value)}
                />
              </div>
              <div>
                <Label>Aulas Presentes</Label>
                <Input
                  type="number"
                  value={presentClasses}
                  onChange={(e) => setPresentClasses(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAttendanceDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAttendance}>Salvar Frequência</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Parecer Descritivo */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Parecer Descritivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aluno</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parecer Descritivo</Label>
              <Textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={8}
                placeholder="Descreva o desempenho, evolução e aspectos relevantes do aluno neste período..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReport}>Salvar Parecer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

