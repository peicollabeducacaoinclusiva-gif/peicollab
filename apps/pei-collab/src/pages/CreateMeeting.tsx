// src/pages/CreateMeeting.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/shared/PageLayout";
import { CalendarIcon, Plus, X, Save, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaTopic {
  id: string;
  topic: string;
  order: number;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface PEI {
  id: string;
  student_id: string | null;
  student?: {
    id: string;
    name: string;
    class_name: string | null;
  } | null;
}

export default function CreateMeeting() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingType, setMeetingType] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("14:00");
  const [location, setLocation] = useState("");
  const [agendaTopics, setAgendaTopics] = useState<AgendaTopic[]>([
    { id: crypto.randomUUID(), topic: "", order: 1 },
  ]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [availablePEIs, setAvailablePEIs] = useState<PEI[]>([]);
  const [selectedPEIs, setSelectedPEIs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🎯 CreateMeeting montado');
    loadTeachers();
    loadPEIs();
  }, []);

  const loadTeachers = async () => {
    console.log('📥 Carregando professores...');
    try {
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['teacher', 'aee_teacher', 'coordinator']);

      if (rolesError) {
        console.error('Erro ao carregar roles:', rolesError);
        setIsLoadingData(false);
        return;
      }

      const userIds = userRolesData?.map(ur => ur.user_id) || [];
      console.log('👥 IDs encontrados:', userIds.length);

      if (userIds.length === 0) {
        console.log('Nenhum professor encontrado');
        setIsLoadingData(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (error) {
        console.error('Erro ao carregar professores:', error);
      } else {
        console.log('✅ Professores carregados:', data?.length);
        setAvailableTeachers(data || []);
      }
    } catch (error: any) {
      console.error('Exceção ao carregar professores:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadPEIs = async () => {
    console.log('📥 Carregando PEIs...');
    try {
      const { data: peisData, error: peisError } = await supabase
        .from('peis')
        .select('id, student_id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (peisError) {
        console.error('Erro ao carregar PEIs:', peisError);
        return;
      }

      if (!peisData || peisData.length === 0) {
        setAvailablePEIs([]);
        return;
      }

      const studentIds = Array.from(
        new Set(peisData.map((pei) => pei.student_id).filter((id): id is string => Boolean(id)))
      );

      let studentsMap = new Map<string, { id: string; name: string; class_name: string | null }>();

      if (studentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, name, class_name')
          .in('id', studentIds);

        if (studentsError) {
          console.warn('Erro ao carregar estudantes dos PEIs:', studentsError.message);
        } else if (studentsData) {
          studentsMap = new Map(studentsData.map((student) => [student.id, student]));
        }
      }

      const enriched = peisData.map<PEI>((pei) => ({
        id: pei.id,
        student_id: pei.student_id,
        student: pei.student_id ? studentsMap.get(pei.student_id) ?? null : null,
      }));

      console.log('✅ PEIs carregados:', enriched.length);
      setAvailablePEIs(enriched);
    } catch (error: any) {
      console.error('Exceção ao carregar PEIs:', error);
    }
  };

  const addAgendaTopic = () => {
    setAgendaTopics([
      ...agendaTopics,
      {
        id: crypto.randomUUID(),
        topic: "",
        order: agendaTopics.length + 1,
      },
    ]);
  };

  const removeAgendaTopic = (id: string) => {
    if (agendaTopics.length > 1) {
      setAgendaTopics(agendaTopics.filter((t) => t.id !== id));
    }
  };

  const updateAgendaTopic = (id: string, topic: string) => {
    setAgendaTopics(
      agendaTopics.map((t) => (t.id === id ? { ...t, topic } : t))
    );
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const togglePEI = (peiId: string) => {
    setSelectedPEIs((prev) =>
      prev.includes(peiId)
        ? prev.filter((id) => id !== peiId)
        : [...prev, peiId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !meetingType || !date || selectedTeachers.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, tipo, data e selecione pelo menos um participante.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      // Combinar data e hora
      const [hours, minutes] = time.split(':');
      const meetingDate = new Date(date);
      meetingDate.setHours(parseInt(hours), parseInt(minutes), 0);

      // Preparar agenda
      const agenda = agendaTopics
        .filter((t) => t.topic.trim())
        .map((t) => ({
          id: t.id,
          topic: t.topic,
          order: t.order,
        }));

      // Criar reunião
      const { data: meeting, error: meetingError } = await supabase
        .from('pei_meetings')
        .insert({
          title,
          description,
          meeting_type: meetingType,
          meeting_date: meetingDate.toISOString(),
          location,
          agenda,
          status: 'scheduled',
          created_by: user.id,
          tenant_id: profile.tenant_id,
          school_id: profile.school_id,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Adicionar participantes
      const participants = selectedTeachers.map((teacherId) => ({
        meeting_id: meeting.id,
        user_id: teacherId,
        presence_status: 'invited',
      }));

      const { error: participantsError } = await supabase
        .from('pei_meeting_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Vincular PEIs
      if (selectedPEIs.length > 0) {
        const peiLinks = selectedPEIs.map((peiId, index) => ({
          meeting_id: meeting.id,
          pei_id: peiId,
          order: index,
        }));

        const { error: peisError } = await supabase
          .from('pei_meeting_peis')
          .insert(peiLinks);

        if (peisError) throw peisError;
      }

      toast({
        title: "Reunião criada",
        description: "A reunião foi agendada com sucesso!",
      });

      navigate('/meetings');
    } catch (error: any) {
      console.error('Erro ao criar reunião:', error);
      toast({
        title: "Erro ao criar reunião",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('🖥️ Renderizando CreateMeeting', { 
    isLoadingData, 
    teachers: availableTeachers.length,
    peis: availablePEIs.length 
  });

  return (
    <PageLayout title="Nova Reunião" backUrl="/meetings">
      <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nova Reunião</h1>
        <p className="text-muted-foreground">
          Agende uma reunião relacionada aos PEIs
        </p>
      </div>

      {isLoadingData && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              Carregando professores e PEIs disponíveis...
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais da reunião
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reunião de Acompanhamento - 1º Bimestre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo da reunião..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Reunião *</Label>
                <Select value={meetingType} onValueChange={setMeetingType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inicial">Inicial</SelectItem>
                    <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Sala de Reuniões"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pauta da Reunião */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pauta da Reunião</CardTitle>
                <CardDescription>
                  Defina os tópicos a serem discutidos
                </CardDescription>
              </div>
              <Button type="button" size="sm" onClick={addAgendaTopic}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Tópico
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {agendaTopics.map((topic, index) => (
              <div key={topic.id} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-8">
                  {index + 1}.
                </span>
                <Input
                  value={topic.topic}
                  onChange={(e) => updateAgendaTopic(topic.id, e.target.value)}
                  placeholder="Descreva o tópico..."
                  className="flex-1"
                />
                {agendaTopics.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAgendaTopic(topic.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Participantes */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Users className="inline mr-2 h-5 w-5" />
              Participantes *
            </CardTitle>
            <CardDescription>
              Selecione os professores que participarão da reunião
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableTeachers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm mb-3">Nenhum professor disponível</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('http://localhost:5174/users', '_blank')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar no Gestão Escolar
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTeachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                      <Checkbox
                        id={`teacher-${teacher.id}`}
                        checked={selectedTeachers.includes(teacher.id)}
                        onCheckedChange={() => toggleTeacher(teacher.id)}
                      />
                      <label
                        htmlFor={`teacher-${teacher.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {teacher.full_name}
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({teacher.email})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedTeachers.length} participante(s) selecionado(s)
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open('http://localhost:5174/users', '_blank')}
                  className="text-xs mt-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Não encontrou? Cadastre no Gestão Escolar
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* PEIs Vinculados */}
        <Card>
          <CardHeader>
            <CardTitle>
              <FileText className="inline mr-2 h-5 w-5" />
              PEIs a Discutir (opcional)
            </CardTitle>
            <CardDescription>
              Selecione os PEIs que serão discutidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availablePEIs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Nenhum PEI disponível</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availablePEIs.map((pei) => (
                    <div key={pei.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                      <Checkbox
                        id={`pei-${pei.id}`}
                        checked={selectedPEIs.includes(pei.id)}
                        onCheckedChange={() => togglePEI(pei.id)}
                      />
                      <label
                        htmlFor={`pei-${pei.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {pei.student?.name || 'Sem nome'}
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({pei.student?.class_name || 'Sem turma'})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedPEIs.length} PEI(s) selecionado(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/meetings')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Criando...' : 'Criar Reunião'}
          </Button>
        </div>
      </form>
      </div>
    </PageLayout>
  );
}
