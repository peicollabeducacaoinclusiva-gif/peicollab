import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, ClipboardCheck, Users } from 'lucide-react';
import { timelineService, WeeklySummary } from '@/services/timelineService';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface MyWeekProps {
  studentId: string;
  familyMemberId: string;
}

export function MyWeek({ studentId, familyMemberId }: MyWeekProps) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  useEffect(() => {
    loadWeeklySummary();
  }, [studentId, familyMemberId, currentWeekStart]);

  const loadWeeklySummary = async () => {
    try {
      setLoading(true);
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const data = await timelineService.getWeeklySummary(
        studentId,
        familyMemberId,
        weekStartStr
      );
      setSummary(data);
    } catch (error) {
      toast.error('Erro ao carregar resumo semanal');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minha Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minha Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível para esta semana
          </div>
        </CardContent>
      </Card>
    );
  }

  const attendancePercentage =
    summary.frequency.total_days > 0
      ? Math.round((summary.frequency.present_days / summary.frequency.total_days) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Minha Semana
            </CardTitle>
            <CardDescription>
              {format(new Date(summary.week_start), "dd 'de' MMMM", { locale: ptBR })} a{' '}
              {format(new Date(summary.week_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousWeek}
              className="px-3 py-1 text-sm border rounded hover:bg-muted"
            >
              ←
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm border rounded hover:bg-muted"
            >
              Hoje
            </button>
            <button
              onClick={goToNextWeek}
              className="px-3 py-1 text-sm border rounded hover:bg-muted"
            >
              →
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequência */}
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Frequência
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total de Dias</p>
              <p className="text-2xl font-bold">{summary.frequency.total_days}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Presente</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.frequency.present_days}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Faltas</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.frequency.absent_days}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Percentual de Presença</span>
              <span className="font-medium">{attendancePercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Atividades */}
        {summary.activities && summary.activities.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Atividades ({summary.activities.length})
            </h3>
            <div className="space-y-2">
              {summary.activities.map((activity, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(activity.date), 'dd/MM', { locale: ptBR })}
                    </Badge>
                    <span className="text-sm">{activity.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avaliações */}
        {summary.evaluations && summary.evaluations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Avaliações ({summary.evaluations.length})
            </h3>
            <div className="space-y-2">
              {summary.evaluations.map((evaluation, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(evaluation.date), 'dd/MM', { locale: ptBR })}
                    </Badge>
                    <span className="text-sm font-medium">{evaluation.title}</span>
                  </div>
                  {evaluation.description && (
                    <p className="text-xs text-muted-foreground">{evaluation.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sessões AEE */}
        {summary.aee_sessions && summary.aee_sessions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sessões AEE ({summary.aee_sessions.length})
            </h3>
            <div className="space-y-2">
              {summary.aee_sessions.map((session, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(session.date), 'dd/MM', { locale: ptBR })}
                    </Badge>
                    <span className="text-sm">{session.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.activities.length === 0 &&
          summary.evaluations.length === 0 &&
          summary.aee_sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade registrada nesta semana
            </div>
          )}
      </CardContent>
    </Card>
  );
}

