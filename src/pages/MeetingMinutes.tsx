// src/pages/MeetingMinutes.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/shared/PageLayout";
import { 
  Save, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  Edit3
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaTopic {
  id: string;
  topic: string;
  order: number;
}

interface MinuteTopic {
  id: string;
  topic: string;
  checked: boolean;
  notes: string;
}

interface Participant {
  id: string;
  user_id: string;
  presence_status: string;
  signed_at: string | null;
  user: {
    full_name: string;
  };
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  meeting_type: string;
  location: string;
  status: string;
  agenda: AgendaTopic[];
  minutes: MinuteTopic[] | null;
  meeting_notes: string | null;
  completed_at: string | null;
}

export default function MeetingMinutes() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [minuteTopics, setMinuteTopics] = useState<MinuteTopic[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🎯 MeetingMinutes montado, ID:', meetingId);
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  const loadMeeting = async () => {
    if (!meetingId) return;

    console.log('📥 Carregando reunião:', meetingId);
    try {
      // Carregar dados da reunião
      const { data: meetingData, error: meetingError } = await supabase
        .from('pei_meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (meetingError) throw meetingError;
      console.log('✅ Reunião carregada:', meetingData);
      setMeeting(meetingData);

      // Carregar participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from('pei_meeting_participants')
        .select('*')
        .eq('meeting_id', meetingId);

      if (participantsError) {
        console.error('Erro ao carregar participantes:', participantsError);
      }

      // Buscar nomes dos participantes
      if (participantsData && participantsData.length > 0) {
        const userIds = participantsData.map(p => p.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const participantsWithNames = participantsData.map(p => ({
          ...p,
          user: {
            full_name: profilesData?.find(prof => prof.id === p.user_id)?.full_name || 'Desconhecido'
          }
        }));
        
        console.log('✅ Participantes carregados:', participantsWithNames.length);
        setParticipants(participantsWithNames);
      } else {
        setParticipants([]);
      }

      // Inicializar ata
      if (meetingData.minutes) {
        setMinuteTopics(meetingData.minutes);
      } else {
        // Criar ata a partir da pauta
        const topics: MinuteTopic[] = meetingData.agenda.map((item: AgendaTopic) => ({
          id: item.id,
          topic: item.topic,
          checked: false,
          notes: "",
        }));
        setMinuteTopics(topics);
      }

      setGeneralNotes(meetingData.meeting_notes || "");
    } catch (error: any) {
      console.error('Erro ao carregar reunião:', error);
      toast({
        title: "Erro ao carregar reunião",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTopicChecked = (topicId: string, checked: boolean) => {
    setMinuteTopics(
      minuteTopics.map((t) => (t.id === topicId ? { ...t, checked } : t))
    );
  };

  const updateTopicNotes = (topicId: string, notes: string) => {
    setMinuteTopics(
      minuteTopics.map((t) => (t.id === topicId ? { ...t, notes } : t))
    );
  };

  const toggleParticipantPresence = async (participantId: string) => {
    try {
      const participant = participants.find((p) => p.id === participantId);
      if (!participant) return;

      const newStatus =
        participant.presence_status === "attended" ? "invited" : "attended";
      const signedAt = newStatus === "attended" ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('pei_meeting_participants')
        .update({
          presence_status: newStatus,
          signed_at: signedAt,
        })
        .eq('id', participantId);

      if (error) throw error;

      // Atualizar estado local
      setParticipants(
        participants.map((p) =>
          p.id === participantId
            ? { ...p, presence_status: newStatus, signed_at: signedAt }
            : p
        )
      );

      toast({
        title: "Presença atualizada",
        description: `Participante marcado como ${
          newStatus === "attended" ? "presente" : "ausente"
        }.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar presença",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveDraft = async () => {
    if (!meetingId) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('pei_meetings')
        .update({
          minutes: minuteTopics,
          meeting_notes: generalNotes,
          status: 'in_progress',
        })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Rascunho salvo",
        description: "As alterações foram salvas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completeMeeting = async () => {
    if (!meetingId) return;

    // Validar se todos os tópicos foram marcados
    const allChecked = minuteTopics.every((t) => t.checked);
    if (!allChecked) {
      toast({
        title: "Ata incompleta",
        description: "Marque todos os tópicos da pauta antes de finalizar.",
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);

    try {
      const { error } = await supabase
        .from('pei_meetings')
        .update({
          minutes: minuteTopics,
          meeting_notes: generalNotes,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Reunião finalizada",
        description: "A ata foi registrada com sucesso!",
      });

      navigate('/meetings');
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar reunião",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  console.log('🖥️ Renderizando MeetingMinutes', { isLoading, hasMeeting: !!meeting });

  if (isLoading) {
    return (
      <PageLayout title="Ata da Reunião" backUrl="/meetings">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando reunião...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!meeting) {
    return (
      <PageLayout title="Ata da Reunião" backUrl="/meetings">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Reunião não encontrada.</p>
                <Button className="mt-4" onClick={() => navigate('/meetings')}>
                  Voltar para Reuniões
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const isCompleted = meeting.status === 'completed';

  return (
    <PageLayout title={isCompleted ? "Visualizar Ata" : "Registrar Ata"} backUrl="/meetings">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">
            {isCompleted ? 'Visualizar Ata' : 'Registrar Ata'}
          </h1>
          {isCompleted && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Concluída
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{meeting.title}</p>
      </div>

      {/* Informações da Reunião */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Reunião</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Data</p>
                <p className="text-muted-foreground">
                  {format(new Date(meeting.meeting_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Horário</p>
                <p className="text-muted-foreground">
                  {format(new Date(meeting.meeting_date), "HH:mm")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Tipo</p>
                <p className="text-muted-foreground capitalize">
                  {meeting.meeting_type}
                </p>
              </div>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2">
                <div>
                  <p className="font-medium">Local</p>
                  <p className="text-muted-foreground">{meeting.location}</p>
                </div>
              </div>
            )}
          </div>
          {meeting.description && (
            <>
              <Separator />
              <div>
                <p className="font-medium mb-1">Descrição</p>
                <p className="text-sm text-muted-foreground">{meeting.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lista de Presença */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Users className="inline mr-2 h-5 w-5" />
            Lista de Presença
          </CardTitle>
          <CardDescription>
            {isCompleted 
              ? 'Participantes que compareceram à reunião'
              : 'Marque os participantes presentes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum participante registrado
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={participant.presence_status === "attended"}
                        onCheckedChange={() => toggleParticipantPresence(participant.id)}
                        disabled={isCompleted}
                      />
                      <div>
                        <p className="font-medium">{participant.user.full_name}</p>
                        {participant.signed_at && (
                          <p className="text-xs text-muted-foreground">
                            Assinou às {format(new Date(participant.signed_at), "HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                    {participant.presence_status === "attended" && (
                      <Badge variant="default" className="bg-green-600">
                        Presente
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {participants.filter((p) => p.presence_status === "attended").length} de{" "}
                {participants.length} presente(s)
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ata da Reunião */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Edit3 className="inline mr-2 h-5 w-5" />
            Ata da Reunião
          </CardTitle>
          <CardDescription>
            {isCompleted
              ? 'Registro dos tópicos discutidos'
              : 'Marque os tópicos discutidos e adicione observações'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {minuteTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum tópico na pauta
            </p>
          ) : (
            minuteTopics.map((topic, index) => (
              <div key={topic.id} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={topic.checked}
                    onCheckedChange={(checked) =>
                      updateTopicChecked(topic.id, checked as boolean)
                    }
                    disabled={isCompleted}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">
                      {index + 1}. {topic.topic}
                    </p>
                    <Textarea
                      value={topic.notes}
                      onChange={(e) => updateTopicNotes(topic.id, e.target.value)}
                      placeholder="Adicione observações sobre este tópico..."
                      rows={2}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Observações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Gerais</CardTitle>
          <CardDescription>
            Comentários adicionais sobre a reunião
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Adicione observações gerais sobre a reunião..."
            rows={4}
            disabled={isCompleted}
          />
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      {!isCompleted && (
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/meetings')}
            disabled={isSaving || isCompleting}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={isSaving || isCompleting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
          <Button
            onClick={completeMeeting}
            disabled={isSaving || isCompleting}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isCompleting ? 'Finalizando...' : 'Finalizar Reunião'}
          </Button>
        </div>
      )}

      {isCompleted && (
        <div className="flex justify-end">
          <Button onClick={() => navigate('/meetings')}>
            Voltar para Reuniões
          </Button>
        </div>
      )}
      </div>
    </PageLayout>
  );
}
