import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { learningHistoryService, LearningHistoryEntry, LearningIndicators } from '@/services/learningHistoryService';
import { alertService, Alert } from '@/services/alertService';
import { useUnifiedStudent } from '@/hooks/useUnifiedStudent';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentLearningHistory() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: student } = useUnifiedStudent(studentId || null);
  const [history, setHistory] = useState<LearningHistoryEntry[]>([]);
  const [indicators, setIndicators] = useState<LearningIndicators | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, indicatorsData, alertsData] = await Promise.all([
        learningHistoryService.getLearningHistory(studentId!, currentYear),
        learningHistoryService.calculateIndicators(studentId!, currentYear),
        alertService.getStudentAlerts(studentId!, 'active'),
      ]);

      setHistory(historyData);
      setIndicators(indicatorsData);
      setAlerts(alertsData);
    } catch (error) {
      toast.error('Erro ao carregar histórico');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'medium':
        return 'bg-yellow-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítico';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Médio';
      default:
        return 'Baixo';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Histórico de Aprendizagem</h1>
            <p className="text-muted-foreground">
              {student?.name || 'Aluno'} - {currentYear}
            </p>
          </div>
        </div>
      </div>

      {/* Indicadores Gerais */}
      {indicators && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Frequência Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.attendance_rate.toFixed(1)}%</div>
              <Progress value={indicators.attendance_rate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.average_grade.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {indicators.subjects_count} disciplina(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Metas do PEI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.pei_goals_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Metas ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sessões AEE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.aee_sessions_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Este ano letivo</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas Ativos */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Alertas Ativos ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}/10 border-${getSeverityColor(alert.severity)}/20`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`${getSeverityColor(alert.severity)} text-white border-0`}
                          >
                            {getSeverityLabel(alert.severity)}
                          </Badge>
                          <span className="text-sm font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await alertService.acknowledgeAlert(alert.id, '');
                            await loadData();
                            toast.success('Alerta reconhecido');
                          } catch (error) {
                            toast.error('Erro ao reconhecer alerta');
                          }
                        }}
                      >
                        Marcar como lido
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tabs com Histórico Detalhado */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="performance">Desempenho por Eixo</TabsTrigger>
          <TabsTrigger value="pei-goals">Metas do PEI</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum registro de histórico encontrado
              </CardContent>
            </Card>
          ) : (
            history.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {entry.period || 'Anual'} {entry.period_number && `- ${entry.period_number}º`}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(entry.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {entry.attendance_rate !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Frequência</p>
                          <p className="text-lg font-bold">{entry.attendance_rate.toFixed(1)}%</p>
                        </div>
                      )}
                      {entry.average_grade !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Média</p>
                          <p className="text-lg font-bold">{entry.average_grade.toFixed(1)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {entry.observations && (
                  <CardContent>
                    <p className="text-sm">{entry.observations}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Eixo/Área</CardTitle>
              <CardDescription>
                Análise de desempenho organizada por eixos de conhecimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidade em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pei-goals">
          <Card>
            <CardHeader>
              <CardTitle>Progresso das Metas do PEI</CardTitle>
              <CardDescription>
                Acompanhamento do progresso das metas do PEI ao longo do ano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidade em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

