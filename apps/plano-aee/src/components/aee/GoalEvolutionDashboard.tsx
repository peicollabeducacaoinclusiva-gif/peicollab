import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Calendar, BarChart3 } from 'lucide-react';
import { structuredPlanService, AEEObjective } from '@/services/structuredPlanService';
import { supabase } from '@pei/database';

interface GoalEvolutionDashboardProps {
  aeeId: string;
  peiGoalId?: string;
}

interface GoalProgress {
  objective_id: string;
  objective_title: string;
  sessions_count: number;
  participation_average: number;
  progress_notes: string[];
  last_session_date?: string;
}

export function GoalEvolutionDashboard({ aeeId, peiGoalId }: GoalEvolutionDashboardProps) {
  const [objectives, setObjectives] = useState<AEEObjective[]>([]);
  const [goalProgress, setGoalProgress] = useState<Record<string, GoalProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [aeeId, peiGoalId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar objetivos
      const plan = await structuredPlanService.getStructuredPlan(aeeId);
      let objectivesData = plan.objectives;

      if (peiGoalId) {
        objectivesData = await structuredPlanService.getObjectivesByPEIGoal(peiGoalId);
      }

      setObjectives(objectivesData);

      // Buscar progresso de cada objetivo
      const progressData: Record<string, GoalProgress> = {};
      for (const objective of objectivesData) {
        const progress = await calculateGoalProgress(objective.id);
        progressData[objective.id] = progress;
      }
      setGoalProgress(progressData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGoalProgress = async (objectiveId: string): Promise<GoalProgress> => {
    // Buscar sessões relacionadas ao objetivo
    const { data: sessions } = await supabase
      .from('aee_sessions')
      .select('id, date, student_participation')
      .eq('objective_id', objectiveId)
      .order('date', { ascending: false });

    // Buscar participações
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: participations } = await supabase
      .from('aee_session_participation')
      .select('participation_level')
      .in('session_id', sessionIds);

    const participationLevels = participations?.map(p => {
      switch (p.participation_level) {
        case 'alta': return 3;
        case 'media': return 2;
        case 'baixa': return 1;
        default: return 0;
      }
    }) || [];

    const participationAverage = participationLevels.length > 0
      ? (participationLevels.reduce((a, b) => a + b, 0) / participationLevels.length) / 3 * 100
      : 0;

    const objective = objectives.find(o => o.id === objectiveId);

    return {
      objective_id: objectiveId,
      objective_title: objective?.title || '',
      sessions_count: sessions?.length || 0,
      participation_average: participationAverage,
      progress_notes: objective?.progress_notes ? [objective.progress_notes] : [],
      last_session_date: sessions?.[0]?.date,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Evolução</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Dashboard de Evolução por Meta
        </CardTitle>
        <CardDescription>
          Acompanhamento do progresso dos objetivos vinculados ao PEI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {objectives.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum objetivo vinculado ao PEI encontrado
          </p>
        ) : (
          <div className="space-y-4">
            {objectives.map((objective) => {
              const progress = goalProgress[objective.id];
              if (!progress) return null;

              return (
                <div key={objective.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">{objective.title}</h4>
                        <Badge variant="outline">{objective.objective_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{objective.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Sessões Realizadas</p>
                      <p className="text-2xl font-bold">{progress.sessions_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Participação Média</p>
                      <p className="text-2xl font-bold">{Math.round(progress.participation_average)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Última Sessão</p>
                      <p className="text-sm font-medium">
                        {progress.last_session_date
                          ? new Date(progress.last_session_date).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso Geral</span>
                      <span className="font-medium">{Math.round(progress.participation_average)}%</span>
                    </div>
                    <Progress value={progress.participation_average} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

