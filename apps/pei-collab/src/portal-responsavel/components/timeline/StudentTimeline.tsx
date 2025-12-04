import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, ClipboardCheck, Users, FileText, MessageSquare } from 'lucide-react';
import { timelineService, TimelineEvent } from '../services/timelineService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface StudentTimelineProps {
  studentId: string;
  familyMemberId: string;
}

export function StudentTimeline({ studentId, familyMemberId }: StudentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [studentId, familyMemberId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await timelineService.getStudentTimeline(studentId, familyMemberId);
      setEvents(data);
    } catch (error) {
      toast.error('Erro ao carregar linha do tempo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'frequency':
        return <Calendar className="h-4 w-4" />;
      case 'activity':
        return <BookOpen className="h-4 w-4" />;
      case 'evaluation':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'aee_session':
        return <Users className="h-4 w-4" />;
      case 'pei_update':
        return <FileText className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'frequency':
        return 'Frequência';
      case 'activity':
        return 'Atividade';
      case 'evaluation':
        return 'Avaliação';
      case 'aee_session':
        return 'Sessão AEE';
      case 'pei_update':
        return 'Atualização PEI';
      case 'message':
        return 'Mensagem';
      default:
        return type;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'frequency':
        return 'bg-blue-600';
      case 'activity':
        return 'bg-green-600';
      case 'evaluation':
        return 'bg-yellow-600';
      case 'aee_session':
        return 'bg-purple-600';
      case 'pei_update':
        return 'bg-orange-600';
      case 'message':
        return 'bg-pink-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linha do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar eventos por data
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.event_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Linha do Tempo do Aluno
        </CardTitle>
        <CardDescription>
          Acompanhamento de frequência, atividades, avaliações e intervenções
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento registrado no período
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateEvents]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-border" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {dateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className={`${getEventColor(event.event_type)} rounded-full p-2 text-white`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getEventLabel(event.event_type)}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

