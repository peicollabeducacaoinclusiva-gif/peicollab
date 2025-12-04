import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, Calendar, Users, Award, FileText, Search, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@pei/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DiaryPublicViewProps {
  studentId?: string;
  enrollmentId?: string;
  accessToken?: string;
  publicLink?: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  lesson_topic: string;
  content_taught: string | null;
  activities: any[];
  homework_assigned: string | null;
  observations: string | null;
  class_name: string;
  subject_name: string | null;
}

interface Grade {
  id: string;
  period: number;
  grade_value: number | null;
  conceptual_grade: string | null;
  descriptive_grade: string | null;
  subject_name: string;
}

interface Attendance {
  id: string;
  period: number;
  attendance_percentage: number;
  present_classes: number;
  total_classes: number;
  subject_name: string | null;
}

interface DescriptiveReport {
  id: string;
  period: number;
  report_text: string;
  created_at: string;
}

export function DiaryPublicView({
  studentId: propStudentId,
  enrollmentId: propEnrollmentId,
  accessToken: propAccessToken,
  publicLink: _publicLink,
}: DiaryPublicViewProps) {
  const { enrollmentId: paramEnrollmentId } = useParams<{ enrollmentId: string }>();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  
  const enrollmentId = propEnrollmentId || paramEnrollmentId;
  const studentId = propStudentId;
  const accessToken = propAccessToken || tokenFromUrl;
  
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<DescriptiveReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);

  // Filtros
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (accessToken && enrollmentId) {
      validateToken();
    } else if (studentId || enrollmentId) {
      setTokenValid(true);
      loadData();
    }
  }, [accessToken, enrollmentId, studentId]);

  useEffect(() => {
    if (tokenValid && (studentId || enrollmentId)) {
      loadData();
    }
  }, [tokenValid, studentId, enrollmentId, selectedPeriod, selectedSubject, dateStart, dateEnd]);

  async function validateToken() {
    if (!accessToken || !enrollmentId) {
      setTokenValid(false);
      return;
    }

    try {
      const { diaryNotificationService } = await import('../services/diaryNotificationService');
      const link = await diaryNotificationService.validatePublicAccessLink(accessToken);
      
      if (link && link.enrollment_id === enrollmentId) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast.error('Token de acesso inválido ou expirado');
      }
    } catch (error: any) {
      console.error('Erro ao validar token:', error);
      setTokenValid(false);
      toast.error('Erro ao validar acesso');
    }
  }

  async function loadData() {
    if (!enrollmentId && !studentId) return;

    try {
      setLoading(true);

      // Buscar dados do enrollment
      if (enrollmentId) {
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .select(`
            *,
            students:student_id(*),
            classes:class_id(class_name, academic_year),
            schools:school_id(school_name)
          `)
          .eq('id', enrollmentId)
          .single();

        if (enrollmentError) throw enrollmentError;
        setEnrollment(enrollmentData);
        setStudent((enrollmentData as any).students);
      } else if (studentId) {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();

        if (studentError) throw studentError;
        setStudent(studentData);
      }

      if (!enrollmentId) return;

      const academicYear = (enrollment as any)?.classes?.academic_year || new Date().getFullYear();

      // Buscar registros do diário
      let diaryQuery = supabase
        .from('class_diary')
        .select(`
          id,
          date,
          lesson_topic,
          content_taught,
          activities,
          homework_assigned,
          observations,
          classes:class_id(class_name),
          subjects:subject_id(subject_name)
        `)
        .eq('class_id', (enrollment as any)?.class_id);

      if (dateStart) {
        diaryQuery = diaryQuery.gte('date', dateStart);
      }
      if (dateEnd) {
        diaryQuery = diaryQuery.lte('date', dateEnd);
      }

      const { data: diaryData, error: diaryError } = await diaryQuery.order('date', { ascending: false });

      if (diaryError) throw diaryError;

      // Filtrar por disciplina se selecionada
      let filteredDiary = diaryData || [];
      if (selectedSubject !== 'all') {
        filteredDiary = filteredDiary.filter((entry: any) => entry.subject_id === selectedSubject);
      }

      // Filtrar por busca
      if (searchTerm) {
        filteredDiary = filteredDiary.filter((entry: any) =>
          entry.lesson_topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.content_taught?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setDiaryEntries(filteredDiary.map((entry: any) => ({
        id: entry.id,
        date: entry.date,
        lesson_topic: entry.lesson_topic,
        content_taught: entry.content_taught,
        activities: entry.activities || [],
        homework_assigned: entry.homework_assigned,
        observations: entry.observations,
        class_name: entry.classes?.class_name || '',
        subject_name: entry.subjects?.subject_name || null,
      })));

      // Buscar notas
      if (selectedPeriod === 'all') {
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select(`
            id,
            period,
            grade_value,
            conceptual_grade,
            descriptive_grade,
            subjects:subject_id(subject_name)
          `)
          .eq('enrollment_id', enrollmentId)
          .eq('academic_year', academicYear)
          .order('period', { ascending: true });

        if (gradesError) throw gradesError;
        setGrades((gradesData || []).map((g: any) => ({
          id: g.id,
          period: g.period,
          grade_value: g.grade_value,
          conceptual_grade: g.conceptual_grade,
          descriptive_grade: g.descriptive_grade,
          subject_name: g.subjects?.subject_name || 'N/A',
        })));
      } else {
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select(`
            id,
            period,
            grade_value,
            conceptual_grade,
            descriptive_grade,
            subjects:subject_id(subject_name)
          `)
          .eq('enrollment_id', enrollmentId)
          .eq('academic_year', academicYear)
          .eq('period', parseInt(selectedPeriod))
          .order('period', { ascending: true });

        if (gradesError) throw gradesError;
        setGrades((gradesData || []).map((g: any) => ({
          id: g.id,
          period: g.period,
          grade_value: g.grade_value,
          conceptual_grade: g.conceptual_grade,
          descriptive_grade: g.descriptive_grade,
          subject_name: g.subjects?.subject_name || 'N/A',
        })));
      }

      // Buscar frequência
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          period,
          attendance_percentage,
          present_classes,
          total_classes,
          subjects:subject_id(subject_name)
        `)
        .eq('enrollment_id', enrollmentId)
        .eq('academic_year', academicYear);

      if (attendanceError) throw attendanceError;
      setAttendance((attendanceData || []).map((a: any) => ({
        id: a.id,
        period: a.period,
        attendance_percentage: a.attendance_percentage,
        present_classes: a.present_classes,
        total_classes: a.total_classes,
        subject_name: a.subjects?.subject_name || null,
      })));

      // Buscar pareceres
      const { data: reportsData, error: reportsError } = await supabase
        .from('descriptive_reports')
        .select('id, period, report_text, created_at')
        .eq('enrollment_id', enrollmentId)
        .eq('academic_year', academicYear)
        .order('period', { ascending: true });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações do diário');
    } finally {
      setLoading(false);
    }
  }

  function handleExportPDF() {
    window.print();
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-semibold mb-2">Acesso Negado</p>
            <p className="text-muted-foreground">
              O link de acesso é inválido, expirado ou foi revogado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aluno não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subjects = Array.from(new Set(diaryEntries.map(e => e.subject_name).filter(Boolean)));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Consulta do Diário Escolar</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {student.name} - {(enrollment as any)?.classes?.class_name || 'N/A'}
                </p>
              </div>
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Imprimir/PDF
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar no conteúdo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="period">Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="1">1º Bimestre</SelectItem>
                    <SelectItem value="2">2º Bimestre</SelectItem>
                    <SelectItem value="3">3º Bimestre</SelectItem>
                    <SelectItem value="4">4º Bimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Disciplina</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {subjects.map((subject, idx) => (
                      <SelectItem key={idx} value={subject || ''}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateStart">Data Inicial</Label>
                  <Input
                    id="dateStart"
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateEnd">Data Final</Label>
                  <Input
                    id="dateEnd"
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo com Abas */}
        <Tabs defaultValue="diary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="diary">
              <BookOpen className="h-4 w-4 mr-2" />
              Diário de Aulas
            </TabsTrigger>
            <TabsTrigger value="grades">
              <Award className="h-4 w-4 mr-2" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Users className="h-4 w-4 mr-2" />
              Frequência
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Pareceres
            </TabsTrigger>
          </TabsList>

          {/* Aba: Diário */}
          <TabsContent value="diary">
            <div className="space-y-4">
              {diaryEntries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </CardContent>
                </Card>
              ) : (
                diaryEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(entry.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                            {entry.subject_name && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <Badge variant="outline">{entry.subject_name}</Badge>
                              </>
                            )}
                          </div>
                          <CardTitle className="text-lg">{entry.lesson_topic}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {entry.content_taught && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Conteúdo Ministrado</Label>
                            <p className="text-sm text-foreground mt-1">{entry.content_taught}</p>
                          </div>
                        )}
                        {entry.activities && entry.activities.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Atividades</Label>
                            <ul className="text-sm text-foreground mt-1 list-disc list-inside">
                              {entry.activities.map((activity: any, idx: number) => (
                                <li key={idx}>
                                  {activity.description || activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {entry.homework_assigned && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Tarefas de Casa</Label>
                            <p className="text-sm text-foreground mt-1">{entry.homework_assigned}</p>
                          </div>
                        )}
                        {entry.observations && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Observações</Label>
                            <p className="text-sm text-muted-foreground mt-1">{entry.observations}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Aba: Notas */}
          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma nota lançada</p>
                ) : (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((period) => {
                      const periodGrades = grades.filter(g => g.period === period);
                      if (periodGrades.length === 0) return null;

                      return (
                        <div key={period} className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">{period}º Bimestre</h3>
                          <div className="space-y-2">
                            {periodGrades.map((grade) => (
                              <div key={grade.id} className="flex items-center justify-between">
                                <span className="text-sm">{grade.subject_name}</span>
                                <div className="flex items-center gap-2">
                                  {grade.grade_value !== null && (
                                    <Badge variant="outline" className="text-lg">
                                      {grade.grade_value.toFixed(1)}
                                    </Badge>
                                  )}
                                  {grade.conceptual_grade && (
                                    <Badge variant="outline">{grade.conceptual_grade}</Badge>
                                  )}
                                  {grade.descriptive_grade && (
                                    <p className="text-xs text-muted-foreground max-w-xs truncate">
                                      {grade.descriptive_grade}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Frequência */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Frequência</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum registro de frequência</p>
                ) : (
                  <div className="space-y-4">
                    {attendance.map((att) => (
                      <div key={att.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{att.period}º Bimestre</h3>
                            {att.subject_name && (
                              <p className="text-sm text-muted-foreground">{att.subject_name}</p>
                            )}
                          </div>
                          <Badge
                            variant={att.attendance_percentage >= 75 ? 'default' : 'destructive'}
                          >
                            {att.attendance_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {att.present_classes} presentes de {att.total_classes} aulas
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Pareceres */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Pareceres Descritivos</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum parecer disponível</p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{report.period}º Bimestre</h3>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(report.created_at), 'dd/MM/yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{report.report_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

