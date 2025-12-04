import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Plus, Search, BookOpen, Calendar, FileText, Download, Edit, Users, Award, AlertCircle } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Textarea, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useUserProfile } from '../hooks/useUserProfile';
import { useClasses } from '../hooks/useClasses';
import { useSchools } from '../hooks/useStudents';
import { DiaryAttendanceEntry } from '../components/DiaryAttendanceEntry';
import { DiaryGradeEntry } from '../components/DiaryGradeEntry';
import { DiaryDescriptiveReport } from '../components/DiaryDescriptiveReport';
import { OccurrenceDialog } from '../components/OccurrenceDialog';
import { DiaryReportCard } from '../components/DiaryReportCard';
import { DiaryTemplateEditor } from '../components/DiaryTemplateEditor';
import { DiaryPublicLinkManager } from '../components/DiaryPublicLinkManager';
import { diaryNotificationService } from '../services/diaryNotificationService';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { occurrenceService, type Occurrence } from '../services/occurrenceService';
import { calendarService, type AcademicCalendar } from '../services/calendarService';
import { toast } from 'sonner';

interface ClassDiaryEntry {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string | null;
  subject_name: string | null;
  teacher_id: string;
  teacher_name: string;
  academic_year: number;
  date: string;
  lesson_number: number | null;
  lesson_topic: string;
  content_taught: string | null;
  activities: any[];
  homework_assigned: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export default function Diary() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const [entries, setEntries] = useState<ClassDiaryEntry[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; subject_name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; enrollment_id?: string }>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ClassDiaryEntry | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Form states
  const [formClassId, setFormClassId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    return dateStr || '';
  });
  const [formLessonNumber, setFormLessonNumber] = useState<string>('');
  const [formLessonTopic, setFormLessonTopic] = useState<string>('');
  const [formContentTaught, setFormContentTaught] = useState<string>('');
  const [formActivities, setFormActivities] = useState<string>('');
  const [formHomework, setFormHomework] = useState<string>('');
  const [formObservations, setFormObservations] = useState<string>('');
  const [showAttendance, setShowAttendance] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [savedDiaryEntryId, setSavedDiaryEntryId] = useState<string | null>(null);
  const [evaluationConfig, setEvaluationConfig] = useState<any>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [occurrenceDialogOpen, setOccurrenceDialogOpen] = useState(false);
  const [selectedStudentForOccurrence, setSelectedStudentForOccurrence] = useState<{ id: string; name: string; enrollment_id?: string } | null>(null);
  const [academicCalendar, setAcademicCalendar] = useState<AcademicCalendar | null>(null);
  const [dayInfo, setDayInfo] = useState<{ isSchoolDay: boolean; type: string; description?: string; events?: any[] } | null>(null);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadSubjects();
      loadEvaluationConfig();
      loadAcademicCalendar();
      if (userProfile.school_id) {
        setSelectedSchool(userProfile.school_id);
      }
    }
  }, [userProfile, academicYear, selectedSchool]);

  useEffect(() => {
    if (formDate && academicCalendar) {
      checkDayInfo();
    }
  }, [formDate, academicCalendar]);

  useEffect(() => {
    if (classFilter !== 'all' && userProfile?.tenant_id) {
      loadOccurrences();
    }
  }, [classFilter, userProfile, academicYear]);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadEntries();
    }
  }, [userProfile, classFilter, subjectFilter, dateStart, dateEnd, academicYear]);

  useEffect(() => {
    if (formClassId && userProfile?.tenant_id) {
      loadStudents();
    }
  }, [formClassId, academicYear]);

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

  async function loadEvaluationConfig() {
    if (!userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('evaluation_configs')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('academic_year', academicYear)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setEvaluationConfig(data);
    } catch (error: any) {
      console.error('Erro ao carregar configuração de avaliação:', error);
    }
  }

  async function loadOccurrences() {
    if (!classFilter || classFilter === 'all' || !userProfile?.tenant_id) return;

    try {
      const data = await occurrenceService.getOccurrences({
        tenantId: userProfile.tenant_id,
        classId: classFilter,
      });
      setOccurrences((data || []) as unknown as Occurrence[]);
    } catch (error: any) {
      console.error('Erro ao carregar ocorrências:', error);
    }
  }

  async function loadAcademicCalendar() {
    if (!userProfile?.tenant_id || !academicYear) return;

    try {
      const calendar = await calendarService.getCalendar({
        schoolId: selectedSchool || userProfile.school_id || undefined,
        tenantId: userProfile.tenant_id,
        academicYear,
      });
      setAcademicCalendar(calendar);
    } catch (error: any) {
      console.error('Erro ao carregar calendário:', error);
    }
  }

  async function checkDayInfo() {
    if (!formDate || !academicCalendar) {
      setDayInfo(null);
      return;
    }

    try {
      const info = await calendarService.getDayInfo(formDate, academicCalendar);
      setDayInfo(info);
    } catch (error: any) {
      console.error('Erro ao verificar informações do dia:', error);
      setDayInfo(null);
    }
  }

  async function loadStudents() {
    if (!formClassId || !userProfile?.tenant_id) return;

    try {
      const { data: enrollments, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          students:student_id(name)
        `)
        .eq('class_id', formClassId)
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

  async function loadEntries() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_class_diary_entries', {
        p_class_id: classFilter === 'all' ? null : classFilter,
        p_subject_id: subjectFilter === 'all' ? null : subjectFilter,
        p_teacher_id: user.id,
        p_academic_year: academicYear,
        p_date_start: dateStart || null,
        p_date_end: dateEnd || null,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar registros do diário:', error);
      toast.error('Erro ao carregar registros do diário');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formClassId || !formSubjectId || !formDate || !formLessonTopic.trim() || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Validar se é dia letivo
    if (academicCalendar) {
      const isSchoolDay = await calendarService.isSchoolDay(formDate, academicCalendar);
      if (!isSchoolDay) {
        const dayInfo = await calendarService.getDayInfo(formDate, academicCalendar);
        const confirmMessage = `Atenção: ${formDate} não é um dia letivo (${dayInfo?.description || dayInfo?.type || 'não letivo'}). Deseja continuar mesmo assim?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }

    try {
      setProcessing(true);

      const activitiesArray = formActivities
        .split('\n')
        .filter(a => a.trim())
        .map(a => ({
          type: 'atividade',
          description: a.trim(),
          duration: 0,
        }));

      const { data: diaryData, error } = await supabase.rpc('create_class_diary_entry', {
        p_class_id: formClassId,
        p_subject_id: formSubjectId,
        p_teacher_id: user.id,
        p_academic_year: academicYear,
        p_date: formDate,
        p_lesson_number: formLessonNumber ? parseInt(formLessonNumber) : null,
        p_lesson_topic: formLessonTopic,
        p_content_taught: formContentTaught || null,
        p_activities: activitiesArray,
        p_homework_assigned: formHomework || null,
        p_observations: formObservations || null,
      });

      if (error) throw error;

      // Se a RPC retornar o ID, usar; caso contrário, buscar o último registro criado
      let diaryId = diaryData?.id;
      if (!diaryId) {
        const { data: lastEntry } = await supabase
          .from('class_diary')
          .select('id')
          .eq('class_id', formClassId)
          .eq('subject_id', formSubjectId)
          .eq('teacher_id', user.id)
          .eq('date', formDate)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        diaryId = lastEntry?.id;
      }

      // Enviar notificação para responsáveis (assíncrono, não bloqueia)
      if (diaryId) {
        // Buscar todos os enrollments da turma para notificar
        try {
          const { data: enrollments } = await supabase
            .from('student_enrollments')
            .select('id')
            .eq('class_id', formClassId)
            .eq('academic_year', academicYear)
            .eq('status', 'active');
          
          if (enrollments && enrollments.length > 0) {
            // Notificar para cada aluno da turma
            for (const enrollment of enrollments) {
              try {
                await diaryNotificationService.sendNotificationToGuardians(
                  enrollment.id,
                  'diary_entry',
                  'Nova entrada no diário de classe',
                  `Nova aula registrada em ${formDate}: ${formLessonTopic}`,
                  diaryId,
                  user.id
                );
              } catch (notifError) {
                console.error('Erro ao enviar notificação:', notifError);
              }
            }
          }
        } catch (err: any) {
          console.warn('Erro ao buscar enrollments para notificação:', err);
        }
      }

      if (diaryId) {
        setSavedDiaryEntryId(diaryId);
        setShowAttendance(true);
        toast.success('Registro do diário criado. Agora você pode registrar a frequência.');
      } else {
        toast.success('Registro do diário criado com sucesso');
        setCreateDialogOpen(false);
        resetForm();
        await loadEntries();
      }
    } catch (error: any) {
      console.error('Erro ao criar registro:', error);
      toast.error(error.message || 'Erro ao criar registro do diário');
    } finally {
      setProcessing(false);
    }
  }

  async function handleUpdate() {
    if (!selectedEntry || !formClassId || !formSubjectId || !formDate || !formLessonTopic.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setProcessing(true);

      const activitiesArray = formActivities
        .split('\n')
        .filter(a => a.trim())
        .map(a => ({
          type: 'atividade',
          description: a.trim(),
          duration: 0,
        }));

      const { error } = await supabase
        .from('class_diary')
        .update({
          class_id: formClassId,
          subject_id: formSubjectId,
          date: formDate,
          lesson_number: formLessonNumber ? parseInt(formLessonNumber) : null,
          lesson_topic: formLessonTopic,
          content_taught: formContentTaught || null,
          activities: activitiesArray,
          homework_assigned: formHomework || null,
          observations: formObservations || null,
        })
        .eq('id', selectedEntry.id);

      if (error) throw error;

      toast.success('Registro atualizado com sucesso');
      setEditDialogOpen(false);
      setSelectedEntry(null);
      resetForm();
      await loadEntries();
    } catch (error: any) {
      console.error('Erro ao atualizar registro:', error);
      toast.error(error.message || 'Erro ao atualizar registro do diário');
    } finally {
      setProcessing(false);
    }
  }

  function resetForm() {
    setFormClassId('');
    setFormSubjectId('');
    setFormDate(new Date().toISOString().split('T')[0] || '');
    setFormLessonNumber('');
    setFormLessonTopic('');
    setFormContentTaught('');
    setFormActivities('');
    setFormHomework('');
    setFormObservations('');
    setShowAttendance(false);
    setSavedDiaryEntryId(null);
  }

  function handleAttendanceSaved() {
    setCreateDialogOpen(false);
    resetForm();
    loadEntries();
  }

  function handleEdit(entry: ClassDiaryEntry) {
    setSelectedEntry(entry);
    setFormClassId(entry.class_id);
    setFormSubjectId(entry.subject_id || '');
    setFormDate((entry.date || new Date().toISOString().split('T')[0]) || '');
    setFormLessonNumber(entry.lesson_number?.toString() || '');
    setFormLessonTopic(entry.lesson_topic || '');
    setFormContentTaught(entry.content_taught || '');
    setFormActivities(
      entry.activities?.map((a: any) => a.description || a).join('\n') || ''
    );
    setFormHomework(entry.homework_assigned || '');
    setFormObservations(entry.observations || '');
    setEditDialogOpen(true);
  }

  async function exportCSV() {
    try {
      const filtered = entries.filter(e => {
        const matchesSearch = !search || 
          e.lesson_topic?.toLowerCase().includes(search.toLowerCase()) ||
          e.class_name?.toLowerCase().includes(search.toLowerCase()) ||
          e.subject_name?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      });

      const headers = [
        'Data',
        'Turma',
        'Disciplina',
        'Número da Aula',
        'Tema',
        'Conteúdo Ministrado',
        'Atividades',
        'Tarefas de Casa',
        'Observações',
      ];

      const rows = filtered.map(e => [
        new Date(e.date).toLocaleDateString('pt-BR'),
        e.class_name,
        e.subject_name || 'N/A',
        e.lesson_number?.toString() || 'N/A',
        e.lesson_topic,
        e.content_taught || 'N/A',
        e.activities?.map((a: any) => a.description || a).join('; ') || 'N/A',
        e.homework_assigned || 'N/A',
        e.observations || 'N/A',
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const filename = `diario_classe_${formatTimestampForFilename()}.csv`;
      downloadTextFile(filename, csv, 'text/csv;charset=utf-8');

      toast.success('Arquivo CSV exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    }
  }

  const filteredEntries = entries.filter(e => {
    const matchesSearch = !search || 
      e.lesson_topic?.toLowerCase().includes(search.toLowerCase()) ||
      e.class_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.content_taught?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const filteredClasses = classesData?.data?.filter(
    cls => !selectedSchool || cls.school_id === selectedSchool
  ) || [];

  const OCCURRENCE_TYPES: Record<string, string> = {
    behavioral: 'Comportamental',
    pedagogical: 'Pedagógica',
    administrative: 'Administrativa',
    attendance: 'Frequência',
    other: 'Outra',
  };

  const SEVERITY_LABELS: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  };

  const SEVERITY_COLORS: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

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
            <h1 className="text-3xl font-bold text-foreground">Diário de Classe</h1>
            <p className="text-muted-foreground mt-1">
              Registro integrado de aulas, frequência, notas e pareceres
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por tema, turma ou disciplina..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {schoolsData.length > 0 && (
                <div>
                  <Label htmlFor="school">Escola</Label>
                  <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger id="school">
                      <SelectValue placeholder="Todas as escolas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as Escolas</SelectItem>
                      {schoolsData.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.school_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="class">Turma</Label>
                <Select value={classFilter} onValueChange={(value) => setClassFilter(value || 'all')}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {filteredClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Disciplina</Label>
                <Select value={subjectFilter} onValueChange={(value: string) => setSubjectFilter(value || 'all')}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {subjects.map(subj => (
                      <SelectItem key={subj.id} value={subj.id}>
                        {subj.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academicYear">Ano Letivo</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={exportCSV} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          </CardContent>
        </Card>

        {/* Conteúdo Principal com Abas */}
        <Tabs defaultValue="entries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entries">
              <BookOpen className="h-4 w-4 mr-2" />
              Registros de Aula
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Users className="h-4 w-4 mr-2" />
              Frequência
            </TabsTrigger>
            <TabsTrigger value="grades">
              <Award className="h-4 w-4 mr-2" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="descriptive-reports">
              <FileText className="h-4 w-4 mr-2" />
              Pareceres
            </TabsTrigger>
            <TabsTrigger value="occurrences">
              <AlertCircle className="h-4 w-4 mr-2" />
              Ocorrências
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Boletins
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="public-links">
              <FileText className="h-4 w-4 mr-2" />
              Links Públicos
            </TabsTrigger>
          </TabsList>

          {/* Aba: Registros de Aula */}
          <TabsContent value="entries">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filteredEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map(entry => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {new Date(entry.date).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                            {entry.lesson_number && (
                              <Badge variant="outline" className="ml-2">
                                Aula {entry.lesson_number}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mb-1">{entry.lesson_topic}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{entry.class_name}</span>
                            {entry.subject_name && (
                              <>
                                <span>•</span>
                                <span>{entry.subject_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormClassId(entry.class_id);
                              setFormSubjectId(entry.subject_id || '');
                              setFormDate((entry.date || new Date().toISOString().split('T')[0]) || '');
                              setSavedDiaryEntryId(entry.id);
                              setCreateDialogOpen(true);
                              setShowAttendance(true);
                            }}
                            title="Ver/Editar Frequência"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          {entry.subject_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormClassId(entry.class_id);
                              setFormSubjectId(entry.subject_id || '');
                              setFormDate((entry.date || new Date().toISOString().split('T')[0]) || '');
                                setSavedDiaryEntryId(entry.id);
                                setCreateDialogOpen(true);
                                setShowGrades(true);
                              }}
                              title="Lançar Notas"
                            >
                              <Award className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            title="Editar Registro"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba: Frequência */}
          <TabsContent value="attendance">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filteredEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum registro encontrado. Crie um registro de aula para registrar frequência.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map(entry => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{entry.lesson_topic}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{entry.class_name}</span>
                            {entry.subject_name && (
                              <>
                                <span>•</span>
                                <span>{entry.subject_name}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormClassId(entry.class_id);
                            setFormSubjectId(entry.subject_id || '');
                            setFormDate((entry.date || new Date().toISOString().split('T')[0]) || '');
                            setSavedDiaryEntryId(entry.id);
                            setCreateDialogOpen(true);
                            setShowAttendance(true);
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Ver/Editar Frequência
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba: Notas */}
          <TabsContent value="grades">
            {classFilter === 'all' || subjectFilter === 'all' ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione uma turma e disciplina para lançar notas
                </CardContent>
              </Card>
            ) : (() => {
              const gradeSubjectId: string = subjectFilter === 'all' ? '' : (subjectFilter as string);
              return (
                <DiaryGradeEntry
                  classId={classFilter === 'all' ? '' : classFilter}
                  subjectId={gradeSubjectId}
                  date={new Date().toISOString().split('T')[0]}
                  academicYear={academicYear}
                  tenantId={userProfile?.tenant_id || ''}
                  evaluationType={(evaluationConfig?.evaluation_type || 'numeric') as 'numeric' | 'conceptual' | 'descriptive'}
                />
              );
            })()}
          </TabsContent>

          {/* Aba: Pareceres */}
          <TabsContent value="descriptive-reports">
            {classFilter === 'all' ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione uma turma para criar pareceres descritivos
                </CardContent>
              </Card>
            ) : (() => {
              const reportSubjectId: string = subjectFilter !== 'all' ? (subjectFilter as string) : '';
              return (
                <DiaryDescriptiveReport
                  classId={classFilter === 'all' ? '' : classFilter}
                  subjectId={reportSubjectId}
                  date={new Date().toISOString().split('T')[0]}
                  academicYear={academicYear}
                  tenantId={userProfile?.tenant_id || ''}
                  userId={''}
                />
              );
            })()}
          </TabsContent>

          {/* Aba: Ocorrências */}
          <TabsContent value="occurrences">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ocorrências e Atendimentos</CardTitle>
                {classFilter !== 'all' && (
                  <Button
                    onClick={async () => {
                      // Carregar alunos para seleção
                      if (classFilter && academicYear) {
                        const { data: enrollments } = await supabase
                          .from('student_enrollments')
                          .select(`
                            id,
                            student_id,
                            students:student_id(name)
                          `)
                          .eq('class_id', classFilter)
                          .eq('academic_year', academicYear)
                          .eq('status', 'active')
                          .order('students(name)');

                        if (enrollments && enrollments.length > 0) {
                          setStudents(
                            enrollments.map((e: any) => ({
                              id: e.student_id,
                              name: e.students?.name || 'N/A',
                              enrollment_id: e.id,
                            }))
                          );
                          setOccurrenceDialogOpen(true);
                        } else {
                          toast.error('Nenhum aluno encontrado nesta turma');
                        }
                      }
                    }}
                    variant="outline"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Nova Ocorrência
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {classFilter === 'all' ? (
                  <p className="text-center text-muted-foreground py-8">
                    Selecione uma turma para visualizar ocorrências
                  </p>
                ) : occurrences.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma ocorrência registrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {occurrences.map((occurrence) => (
                      <div key={occurrence.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{occurrence.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {(occurrence as any).students?.name || 'N/A'} • {new Date(occurrence.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={SEVERITY_COLORS[occurrence.severity]}>
                              {SEVERITY_LABELS[occurrence.severity]}
                            </Badge>
                            <Badge variant="outline">
                              {OCCURRENCE_TYPES[occurrence.occurrence_type]}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-foreground mt-2">{occurrence.description}</p>
                        {occurrence.actions_taken && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Ações tomadas:</strong> {occurrence.actions_taken}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Boletins */}
          <TabsContent value="reports">
            {classFilter === 'all' ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione uma turma para gerar boletins
                </CardContent>
              </Card>
            ) : (
              <DiaryReportCard
                classId={classFilter}
                academicYear={academicYear}
                tenantId={userProfile?.tenant_id || ''}
              />
            )}
          </TabsContent>

          {/* Aba: Templates */}
          <TabsContent value="templates">
            {userProfile?.tenant_id ? (
              <DiaryTemplateEditor
                tenantId={userProfile.tenant_id}
                schoolId={userProfile.school_id || undefined}
                userId={''}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Carregando informações do usuário...
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba: Links Públicos */}
          <TabsContent value="public-links">
            {classFilter === 'all' ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione uma turma para gerenciar links públicos
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um aluno para criar e gerenciar links públicos de acesso ao diário
                </p>
                {students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {students.map((student) => {
                      const enrollment = students.find(s => s.id === student.id);
                      return enrollment ? (
                        <Card key={student.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">{student.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <DiaryPublicLinkManager
                              enrollmentId={enrollment.enrollment_id || ''}
                              userId={''}
                            />
                          </CardContent>
                        </Card>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhum aluno encontrado nesta turma
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Criação */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Registro do Diário</DialogTitle>
            <DialogDescription>
              Registre o conteúdo da aula ministrada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formClass">Turma *</Label>
                <Select value={formClassId} onValueChange={setFormClassId}>
                  <SelectTrigger id="formClass">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="formSubject">Disciplina *</Label>
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger id="formSubject">
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subj => (
                      <SelectItem key={subj.id} value={subj.id}>
                        {subj.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formDate">Data *</Label>
                <Input
                  id="formDate"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
                {dayInfo && (
                  <div className="mt-2">
                    <Badge
                      variant={dayInfo.isSchoolDay ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {dayInfo.isSchoolDay ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Dia Letivo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {(typeof dayInfo.description === 'string' ? dayInfo.description : dayInfo.type) || ''}
                        </span>
                      )}
                    </Badge>
                    {('events' in dayInfo && dayInfo.events && Array.isArray(dayInfo.events) && dayInfo.events.length > 0) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {String((dayInfo.events as any[]).map((e: any) => String(e.name || e.description || '')).join(', '))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="formLessonNumber">Número da Aula</Label>
                <Input
                  id="formLessonNumber"
                  type="number"
                  value={formLessonNumber}
                  onChange={(e) => setFormLessonNumber(e.target.value)}
                  placeholder="Ex: 1, 2, 3..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="formLessonTopic">Tema da Aula *</Label>
              <Input
                id="formLessonTopic"
                value={formLessonTopic}
                onChange={(e) => setFormLessonTopic(e.target.value)}
                placeholder="Ex: Introdução à Álgebra"
                required
              />
            </div>

            <div>
              <Label htmlFor="formContentTaught">Conteúdo Ministrado</Label>
              <Textarea
                id="formContentTaught"
                value={formContentTaught}
                onChange={(e) => setFormContentTaught(e.target.value)}
                placeholder="Descreva o conteúdo ministrado na aula..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="formActivities">Atividades Realizadas</Label>
              <Textarea
                id="formActivities"
                value={formActivities}
                onChange={(e) => setFormActivities(e.target.value)}
                placeholder="Uma atividade por linha..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Digite uma atividade por linha
              </p>
            </div>

            <div>
              <Label htmlFor="formHomework">Tarefas de Casa</Label>
              <Textarea
                id="formHomework"
                value={formHomework}
                onChange={(e) => setFormHomework(e.target.value)}
                placeholder="Tarefas atribuídas para casa..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="formObservations">Observações</Label>
              <Textarea
                id="formObservations"
                value={formObservations}
                onChange={(e) => setFormObservations(e.target.value)}
                placeholder="Observações adicionais sobre a aula..."
                rows={3}
              />
            </div>

            {showAttendance && savedDiaryEntryId && formClassId && formSubjectId && userProfile?.tenant_id && (
              <div className="pt-4 border-t">
                <DiaryAttendanceEntry
                  classId={formClassId}
                  subjectId={formSubjectId}
                  date={formDate}
                  academicYear={academicYear}
                  tenantId={userProfile.tenant_id}
                  diaryEntryId={savedDiaryEntryId}
                  onSave={handleAttendanceSaved}
                />
              </div>
            )}

            {showGrades && savedDiaryEntryId && formClassId && formSubjectId && userProfile?.tenant_id && (
              <div className="pt-4 border-t">
                <DiaryGradeEntry
                  classId={formClassId}
                  subjectId={formSubjectId}
                  date={formDate}
                  academicYear={academicYear}
                  tenantId={userProfile.tenant_id}
                  diaryEntryId={savedDiaryEntryId}
                  evaluationType={(evaluationConfig?.evaluation_type || 'numeric') as 'numeric' | 'conceptual' | 'descriptive'}
                />
              </div>
            )}

            {showReports && savedDiaryEntryId && formClassId && userProfile?.tenant_id && (
              <div className="pt-4 border-t">
                <DiaryDescriptiveReport
                  classId={formClassId}
                  subjectId={formSubjectId}
                  date={formDate}
                  academicYear={academicYear}
                  tenantId={userProfile.tenant_id}
                  diaryEntryId={savedDiaryEntryId}
                  userId={''}
                />
              </div>
            )}

            {/* Opções para adicionar frequência, notas e pareceres após salvar */}
            {savedDiaryEntryId && !showAttendance && !showGrades && !showReports && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAttendance(true);
                      loadStudents();
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Registrar Frequência
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGrades(true);
                      loadStudents();
                    }}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Lançar Notas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReports(true);
                      loadStudents();
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Criar Pareceres
                  </Button>
                </div>
              </div>
            )}

            {!showAttendance && (
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={processing}>
                  {processing ? 'Salvando...' : 'Salvar Registro'}
                </Button>
              </div>
            )}

            {showAttendance && (
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                  loadEntries();
                }}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro do Diário</DialogTitle>
            <DialogDescription>
              Atualize as informações do registro
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editClass">Turma *</Label>
                  <Select value={formClassId} onValueChange={setFormClassId}>
                    <SelectTrigger id="editClass">
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editSubject">Disciplina *</Label>
                  <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                    <SelectTrigger id="editSubject">
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subj => (
                        <SelectItem key={subj.id} value={subj.id}>
                          {subj.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDate">Data *</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editLessonNumber">Número da Aula</Label>
                  <Input
                    id="editLessonNumber"
                    type="number"
                    value={formLessonNumber}
                    onChange={(e) => setFormLessonNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editLessonTopic">Tema da Aula *</Label>
                <Input
                  id="editLessonTopic"
                  value={formLessonTopic}
                  onChange={(e) => setFormLessonTopic(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="editContentTaught">Conteúdo Ministrado</Label>
                <Textarea
                  id="editContentTaught"
                  value={formContentTaught}
                  onChange={(e) => setFormContentTaught(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="editActivities">Atividades Realizadas</Label>
                <Textarea
                  id="editActivities"
                  value={formActivities}
                  onChange={(e) => setFormActivities(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="editHomework">Tarefas de Casa</Label>
                <Textarea
                  id="editHomework"
                  value={formHomework}
                  onChange={(e) => setFormHomework(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="editObservations">Observações</Label>
                <Textarea
                  id="editObservations"
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedEntry(null);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={processing}>
                  {processing ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Seleção de Aluno para Ocorrência */}
      <Dialog open={occurrenceDialogOpen && !selectedStudentForOccurrence} onOpenChange={(open) => {
        if (!open) {
          setOccurrenceDialogOpen(false);
          setSelectedStudentForOccurrence(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Aluno</DialogTitle>
            <DialogDescription>
              Selecione o aluno para registrar a ocorrência
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {students.map((student) => (
              <Button
                key={student.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedStudentForOccurrence({
                    id: student.id,
                    name: student.name,
                    enrollment_id: student.enrollment_id,
                  });
                }}
              >
                {student.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Ocorrência */}
      {selectedStudentForOccurrence && classFilter !== 'all' && userProfile && (
        <OccurrenceDialog
          open={!!selectedStudentForOccurrence}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedStudentForOccurrence(null);
              setOccurrenceDialogOpen(false);
            }
          }}
          studentId={selectedStudentForOccurrence.id}
          studentName={selectedStudentForOccurrence.name}
          enrollmentId={(selectedStudentForOccurrence.enrollment_id || '') as string}
          classId={classFilter}
          subjectId={(() => {
            if (subjectFilter !== 'all' && subjectFilter) {
              return subjectFilter as string;
            }
            return undefined;
          })()}
          date={new Date().toISOString().split('T')[0]}
          tenantId={userProfile.tenant_id || ''}
          userId={''}
          onSave={() => {
            loadOccurrences();
            setSelectedStudentForOccurrence(null);
            setOccurrenceDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
