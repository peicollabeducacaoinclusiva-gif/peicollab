import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { peiIntegrationService, PEIGoal } from '@/services/peiIntegrationService';
import { toast } from 'sonner';

interface PEIGoalsListProps {
  studentId: string;
  onGoalSelect?: (goalId: string) => void;
}

export function PEIGoalsList({ studentId, onGoalSelect }: PEIGoalsListProps) {
  const [goals, setGoals] = useState<PEIGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, [studentId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await peiIntegrationService.getPEIGoals(studentId);
      setGoals(data);
    } catch (error) {
      toast.error('Erro ao carregar metas do PEI');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressIcon = (progress?: string) => {
    switch (progress) {
      case 'alcançada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'em andamento':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'parcialmente alcançada':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProgressBadge = (progress?: string) => {
    switch (progress) {
      case 'alcançada':
        return <Badge variant="default" className="bg-green-600">Alcançada</Badge>;
      case 'em andamento':
        return <Badge variant="default" className="bg-blue-600">Em Andamento</Badge>;
      case 'parcialmente alcançada':
        return <Badge variant="default" className="bg-yellow-600">Parcial</Badge>;
      default:
        return <Badge variant="outline">Não Iniciada</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas do PEI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando metas...</p>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas do PEI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhuma meta do PEI encontrada para este aluno
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas do PEI ({goals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  onGoalSelect
                    ? 'hover:bg-muted hover:border-primary'
                    : 'bg-card'
                }`}
                onClick={() => onGoalSelect?.(goal.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getProgressIcon(goal.progress_level)}
                      <span className="text-sm font-medium">{goal.description}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {goal.category && (
                        <Badge variant="outline" className="text-xs">
                          {goal.category === 'academic' ? 'Acadêmica' : 'Funcional'}
                        </Badge>
                      )}
                      {getProgressBadge(goal.progress_level)}
                      {goal.target_date && (
                        <span className="text-xs text-muted-foreground">
                          Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

