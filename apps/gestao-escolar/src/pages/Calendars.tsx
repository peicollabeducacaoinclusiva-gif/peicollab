import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Input, Textarea } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  date: string;
  type: 'class' | 'holiday' | 'recess' | 'event';
  description: string;
  name?: string;
}

interface AcademicCalendar {
  id: string;
  school_name: string;
  academic_year: number;
  school_days: CalendarEvent[];
  holidays: CalendarEvent[];
  recess_periods: any[];
  events: CalendarEvent[];
  total_school_days: number | null;
}

export default function Calendars() {
  const [calendar, setCalendar] = useState<AcademicCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Dialog states
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventType, setEventType] = useState<string>('event');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId || schoolId) {
      loadCalendar();
    }
  }, [tenantId, schoolId, academicYear]);

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

  async function loadCalendar() {
    try {
      setLoading(true);
      if (!tenantId && !schoolId) return;

      const { data, error } = await supabase.rpc('get_academic_calendars', {
        p_school_id: schoolId || null,
        p_tenant_id: tenantId || null,
        p_academic_year: academicYear,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCalendar(data[0]);
      } else {
        setCalendar(null);
      }
    } catch (error: any) {
      console.error('Erro ao carregar calendário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar calendário',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvent() {
    if (!selectedDate || !eventName.trim() || !calendar || !schoolId || !tenantId) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const newEvent: CalendarEvent = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        type: eventType as any,
        description: eventDescription || '',
        name: eventName,
      };

      const updatedEvents = [...(calendar.events || []), newEvent];

      const { error } = await supabase.rpc('create_academic_calendar', {
        p_school_id: schoolId,
        p_tenant_id: tenantId,
        p_academic_year: academicYear,
        p_calendar_data: (calendar as any).calendar_data || {},
        p_school_days: calendar.school_days || [],
        p_holidays: calendar.holidays || [],
        p_recess_periods: calendar.recess_periods || [],
        p_events: updatedEvents,
        p_total_school_days: calendar.total_school_days,
        p_total_instructional_hours: null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Evento adicionado ao calendário',
      });

      setEventDialogOpen(false);
      setSelectedDate(null);
      setEventName('');
      setEventDescription('');
      setEventType('event');
      await loadCalendar();
    } catch (error: any) {
      console.error('Erro ao adicionar evento:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar evento',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  function getEventsForDate(date: Date): CalendarEvent[] {
    if (!calendar) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return [
      ...(calendar.school_days || []).filter(e => e.date === dateStr),
      ...(calendar.holidays || []).filter(e => e.date === dateStr),
      ...(calendar.events || []).filter(e => e.date === dateStr),
    ];
  }

  function getEventColor(type: string): string {
    switch (type) {
      case 'class':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'holiday':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'recess':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'event':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Adicionar dias do início da semana
  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (firstDayOfWeek - i));
    return date;
  });

  // Adicionar dias do fim da semana
  const lastDayOfWeek = monthEnd.getDay();
  const daysAfterMonth = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + (i + 1));
    return date;
  });

  const allDays = [...daysBeforeMonth, ...daysInMonth, ...daysAfterMonth];

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
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Calendário Escolar</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Controles */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center">
                  {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="academicYear">Ano Letivo:</Label>
                  <Input
                    id="academicYear"
                    type="number"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-24"
                  />
                </div>
                <Button onClick={() => {
                  setSelectedDate(new Date());
                  setEventDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Evento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendário */}
        <Card>
          <CardContent className="pt-6">
            {calendar ? (
              <div className="space-y-4">
                {/* Legenda */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30"></div>
                    <span className="text-sm text-foreground">Dia Letivo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30"></div>
                    <span className="text-sm text-foreground">Feriado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30"></div>
                    <span className="text-sm text-foreground">Recesso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30"></div>
                    <span className="text-sm text-foreground">Evento</span>
                  </div>
                </div>

                {/* Grid do Calendário */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Cabeçalho dos dias da semana */}
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center font-medium text-muted-foreground text-sm">
                      {day}
                    </div>
                  ))}

                  {/* Dias do mês */}
                  {allDays.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());
                    const events = getEventsForDate(day);
                    const isHoliday = events.some(e => e.type === 'holiday');
                    const isRecess = events.some(e => e.type === 'recess');
                    // const hasEvent = events.some(e => e.type === 'event'); // Não usado no momento

                    return (
                      <div
                        key={idx}
                        className={`
                          min-h-[80px] p-1 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors
                          ${!isCurrentMonth ? 'opacity-40' : ''}
                          ${isToday ? 'border-primary bg-primary/5' : ''}
                          ${isHoliday ? 'bg-red-50 dark:bg-red-900/10' : ''}
                          ${isRecess ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                        `}
                        onClick={() => {
                          setSelectedDate(day);
                          setEventDialogOpen(true);
                        }}
                      >
                        <div className="text-sm font-medium text-foreground mb-1">
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {events.slice(0, 2).map((event, eventIdx) => (
                            <Badge
                              key={eventIdx}
                              className={`text-xs ${getEventColor(event.type)}`}
                            >
                              {event.name || event.description || event.type}
                            </Badge>
                          ))}
                          {events.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{events.length - 2} mais
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Estatísticas */}
                {calendar.total_school_days && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total de dias letivos: <span className="font-medium text-foreground">{calendar.total_school_days}</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum calendário cadastrado para o ano letivo {academicYear}
                </p>
                <Button onClick={() => {
                  // Criar calendário básico
                  setEventDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Calendário
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Adicionar Evento */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Evento ao Calendário</DialogTitle>
            <DialogDescription>
              Adicione um evento, feriado ou recesso ao calendário escolar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="eventDate">Data *</Label>
              <Input
                id="eventDate"
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                required
              />
            </div>

            <div>
              <Label htmlFor="eventType">Tipo *</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="holiday">Feriado</SelectItem>
                  <SelectItem value="recess">Recesso</SelectItem>
                  <SelectItem value="class">Dia Letivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="eventName">Nome/Título *</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ex: Reunião de Pais, Feriado Nacional..."
                required
              />
            </div>

            <div>
              <Label htmlFor="eventDescription">Descrição</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Descrição do evento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddEvent} disabled={processing}>
                {processing ? 'Adicionando...' : 'Adicionar Evento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

