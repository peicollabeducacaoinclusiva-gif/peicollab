import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Clock, Plus, Save } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Input } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';

interface ClassSchedule {
  id: string;
  class_id: string;
  class_name: string;
  academic_year: number;
  monday?: any[];
  tuesday?: any[];
  wednesday?: any[];
  thursday?: any[];
  friday?: any[];
  saturday?: any[];
  total_weekly_hours: number | null;
}

interface Class {
  id: string;
  class_name: string;
  education_level: string;
  grade: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
];

export default function Schedules() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  
  // Filtros
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [_selectedSlot, _setSelectedSlot] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Form states para novo slot
  const [slotTimeStart, setSlotTimeStart] = useState<string>('07:00');
  const [slotTimeEnd, setSlotTimeEnd] = useState<string>('08:00');
  const [slotSubjectId, setSlotSubjectId] = useState<string>('');
  const [slotTeacherId, setSlotTeacherId] = useState<string>('');
  const [slotRoom, setSlotRoom] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId || schoolId) {
      loadData();
      loadClasses();
      loadSubjects();
      loadTeachers();
    }
  }, [tenantId, schoolId, classFilter, academicYear]);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
        const { data: userTenant } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userTenant) {
          setTenantId(userTenant.tenant_id);
        }
      }

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      if (!tenantId && !schoolId) return;

      const { data, error } = await supabase.rpc('get_class_schedules', {
        p_class_id: classFilter === 'all' ? null : classFilter,
        p_school_id: schoolId || null,
        p_academic_year: academicYear,
      });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar grades:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar grades de horários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadClasses() {
    try {
      if (!tenantId) return;

      const query = supabase
        .from('classes')
        .select('id, class_name, education_level, grade')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (schoolId) {
        query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('class_name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  }

  async function loadSubjects() {
    try {
      if (!tenantId) return;

      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .eq('tenant_id', tenantId)
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  }

  async function loadTeachers() {
    try {
      if (!schoolId && !tenantId) return;

      const query = supabase
        .from('professionals')
        .select('id, full_name')
        .eq('is_active', true)
        .in('role', ['teacher', 'aee_teacher']);

      if (schoolId) {
        query.eq('school_id', schoolId);
      } else if (tenantId) {
        query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    }
  }

  async function handleSaveSchedule() {
    if (!selectedSchedule) return;

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('create_class_schedule', {
        p_class_id: selectedSchedule.class_id,
        p_academic_year: academicYear,
        p_schedule_data: {},
        p_monday: selectedSchedule.monday,
        p_tuesday: selectedSchedule.tuesday,
        p_wednesday: selectedSchedule.wednesday,
        p_thursday: selectedSchedule.thursday,
        p_friday: selectedSchedule.friday,
        p_saturday: selectedSchedule.saturday,
        p_total_weekly_hours: selectedSchedule.total_weekly_hours,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Grade de horários salva com sucesso',
      });

      setEditDialogOpen(false);
      setSelectedSchedule(null);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao salvar grade:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar grade de horários',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  function handleAddSlot() {
    if (!selectedSchedule || !slotSubjectId || !slotTeacherId || !slotTimeStart || !slotTimeEnd) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    const newSlot = {
      time_start: slotTimeStart,
      time_end: slotTimeEnd,
      subject_id: slotSubjectId,
      teacher_id: slotTeacherId,
      room: slotRoom || null,
    };

    const updatedSchedule = { ...selectedSchedule };
    const daySlots = updatedSchedule[selectedDay as keyof ClassSchedule] as any[];
    (updatedSchedule[selectedDay as keyof ClassSchedule] as any) = [...(daySlots || []), newSlot];

    setSelectedSchedule(updatedSchedule);
    setSlotTimeStart('07:00');
    setSlotTimeEnd('08:00');
    setSlotSubjectId('');
    setSlotTeacherId('');
    setSlotRoom('');
  }

  function handleRemoveSlot(day: string, index: number) {
    if (!selectedSchedule) return;

    const updatedSchedule = { ...selectedSchedule };
    const daySlots = updatedSchedule[day as keyof ClassSchedule] as any[];
    (updatedSchedule[day as keyof ClassSchedule] as any) = daySlots.filter((_, i) => i !== index);

    setSelectedSchedule(updatedSchedule);
  }

  function handleEditSchedule(schedule: ClassSchedule) {
    setSelectedSchedule(schedule);
    setEditDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Grades de Horários</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="classFilter">Turma</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger id="classFilter">
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
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
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Grades */}
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma grade de horários encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map(schedule => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{schedule.class_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ano Letivo {schedule.academic_year}
                        {schedule.total_weekly_hours && ` • ${schedule.total_weekly_hours}h semanais`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      Editar Grade
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {DAYS_OF_WEEK.map(day => {
                      const daySlots = schedule[day.key as keyof ClassSchedule] as any[] || [];
                      return (
                        <div key={day.key} className="border rounded-lg p-3">
                          <h3 className="font-medium text-sm text-foreground mb-2">{day.label}</h3>
                          <div className="space-y-2">
                            {daySlots.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sem horários</p>
                            ) : (
                              daySlots.map((slot: any, idx: number) => (
                                <div key={idx} className="text-xs bg-muted p-2 rounded">
                                  <p className="font-medium text-foreground">
                                    {slot.time_start} - {slot.time_end}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {subjects.find(s => s.id === slot.subject_id)?.subject_name || 'N/A'}
                                  </p>
                                  {slot.room && (
                                    <p className="text-muted-foreground">Sala: {slot.room}</p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Editar Grade */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Grade de Horários</DialogTitle>
            <DialogDescription>
              Configure os horários da turma {selectedSchedule?.class_name}
            </DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4">
              {/* Seleção de Dia */}
              <div>
                <Label>Dia da Semana</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day.key} value={day.key}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Formulário de Novo Horário */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Horário</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="slotTimeStart">Horário Início *</Label>
                      <Input
                        id="slotTimeStart"
                        type="time"
                        value={slotTimeStart}
                        onChange={(e) => setSlotTimeStart(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slotTimeEnd">Horário Fim *</Label>
                      <Input
                        id="slotTimeEnd"
                        type="time"
                        value={slotTimeEnd}
                        onChange={(e) => setSlotTimeEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="slotSubject">Disciplina *</Label>
                      <Select value={slotSubjectId} onValueChange={setSlotSubjectId}>
                        <SelectTrigger id="slotSubject">
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
                    <div>
                      <Label htmlFor="slotTeacher">Professor *</Label>
                      <Select value={slotTeacherId} onValueChange={setSlotTeacherId}>
                        <SelectTrigger id="slotTeacher">
                          <SelectValue placeholder="Selecione o professor" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slotRoom">Sala</Label>
                    <Input
                      id="slotRoom"
                      value={slotRoom}
                      onChange={(e) => setSlotRoom(e.target.value)}
                      placeholder="Ex: Sala 101, Laboratório..."
                    />
                  </div>

                  <Button onClick={handleAddSlot} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Horário
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Horários do Dia Selecionado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Horários de {DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const daySlots = selectedSchedule[selectedDay as keyof ClassSchedule] as any[] || [];
                    return daySlots.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum horário cadastrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map((slot: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {slot.time_start} - {slot.time_end}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {subjects.find(s => s.id === slot.subject_id)?.subject_name || 'N/A'} • {teachers.find(t => t.id === slot.teacher_id)?.full_name || 'N/A'}
                                {slot.room && ` • Sala: ${slot.room}`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSlot(selectedDay, idx)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedSchedule(null);
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSchedule} disabled={processing}>
                  <Save className="h-4 w-4 mr-2" />
                  {processing ? 'Salvando...' : 'Salvar Grade'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

