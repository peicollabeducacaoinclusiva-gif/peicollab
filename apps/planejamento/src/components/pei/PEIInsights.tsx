import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, Users, Package, Wrench } from 'lucide-react';
import { peiConnectionService, PlanningInsights } from '@/services/peiConnectionService';
import { toast } from 'sonner';

interface PEIInsightsProps {
  classId: string;
  date?: string;
}

export function PEIInsights({ classId, date }: PEIInsightsProps) {
  const [insights, setInsights] = useState<PlanningInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [classId, date]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await peiConnectionService.getPlanningInsights(classId, date);
      setInsights(data);
    } catch (error) {
      toast.error('Erro ao carregar insights PEI/AEE');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights PEI/AEE</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Insights PEI/AEE para esta Turma
        </CardTitle>
        <CardDescription>
          Metas do PEI, objetivos do AEE, adaptações e recursos sugeridos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-6">
            {/* Metas do PEI */}
            {insights.pei_goals && insights.pei_goals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4" />
                  Metas do PEI ({insights.pei_goals.length})
                </h3>
                <div className="space-y-2">
                  {insights.pei_goals.map((goal) => (
                    <div key={goal.goal_id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{goal.student_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {goal.category}
                            </Badge>
                            <Badge
                              variant={
                                goal.progress_level === 'alcançada'
                                  ? 'default'
                                  : goal.progress_level === 'em andamento'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-xs"
                            >
                              {goal.progress_level || 'Não iniciada'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objetivos do AEE */}
            {insights.aee_objectives && insights.aee_objectives.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Wrench className="h-4 w-4" />
                  Objetivos do AEE ({insights.aee_objectives.length})
                </h3>
                <div className="space-y-2">
                  {insights.aee_objectives.map((objective) => (
                    <div key={objective.objective_id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{objective.student_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {objective.objective_type}
                            </Badge>
                            <Badge
                              variant={objective.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {objective.status === 'active' ? 'Ativo' : objective.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{objective.title}</p>
                          <p className="text-sm text-muted-foreground">{objective.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adaptações */}
            {insights.adaptations && insights.adaptations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" />
                  Adaptações Necessárias ({insights.adaptations.length})
                </h3>
                <div className="space-y-2">
                  {insights.adaptations.map((adaptation, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{adaptation.student_name}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {adaptation.adaptation_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{adaptation.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recursos */}
            {insights.resources && insights.resources.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" />
                  Recursos Sugeridos ({insights.resources.length})
                </h3>
                <div className="space-y-2">
                  {insights.resources.map((resource, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {resource.resource_type}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!insights.pei_goals || insights.pei_goals.length === 0) &&
              (!insights.aee_objectives || insights.aee_objectives.length === 0) &&
              (!insights.adaptations || insights.adaptations.length === 0) &&
              (!insights.resources || insights.resources.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum insight PEI/AEE disponível para esta turma
                </div>
              )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
