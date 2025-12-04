// ============================================================================
// COMPONENTE: GoalsList
// ============================================================================
// Lista de metas com progresso e estatísticas
// Data: 2025-01-09
// ============================================================================

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Progress,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { Plus, Edit, Trash2, Target } from 'lucide-react';
import { usePlanGoals } from '../../../hooks/usePlanGoals';
import { GoalForm } from './GoalForm';
import type { PlanGoal } from '../../../types/planoAEE.types';
import {
  GOAL_STATUS_LABELS,
  GOAL_AREA_LABELS,
  GOAL_PRIORITY_ICONS,
} from '../../../types/planoAEE.types';

// ============================================================================
// PROPS
// ============================================================================

interface GoalsListProps {
  planId: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function GoalsList({ planId }: GoalsListProps) {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, statistics } =
    usePlanGoals(planId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PlanGoal | null>(null);

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    const colors = {
      nao_iniciada: 'bg-gray-100 text-gray-800',
      em_andamento: 'bg-blue-100 text-blue-800',
      alcancada: 'bg-green-100 text-green-800',
      parcialmente_alcancada: 'bg-yellow-100 text-yellow-800',
      ajustada: 'bg-purple-100 text-purple-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.nao_iniciada;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando metas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alcançadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.achieved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alta Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.high_priority}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Metas do Plano</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta SMART</DialogTitle>
            </DialogHeader>
            <GoalForm
              planId={planId}
              onSubmit={(data) => {
                createGoal.mutate(data as any);
                setIsCreateDialogOpen(false);
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createGoal.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4 text-center">
              Nenhuma meta cadastrada ainda
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{GOAL_PRIORITY_ICONS[goal.priority]}</span>
                        <Badge variant="outline" className="capitalize">
                          {GOAL_AREA_LABELS[goal.goal_area]}
                        </Badge>
                        <Badge className={getStatusColor(goal.progress_status)}>
                          {GOAL_STATUS_LABELS[goal.progress_status]}
                        </Badge>
                      </div>
                      <p className="text-lg font-medium leading-relaxed">{goal.goal_description}</p>
                      {goal.target_date && (
                        <p className="text-sm text-muted-foreground">
                          📅 Data alvo: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {/* Botão Editar */}
                      <Dialog
                        open={editingGoal?.id === goal.id}
                        onOpenChange={(open) => !open && setEditingGoal(null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditingGoal(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Meta</DialogTitle>
                          </DialogHeader>
                          <GoalForm
                            planId={planId}
                            initialData={goal}
                            onSubmit={(data) => {
                              updateGoal.mutate({ id: goal.id, input: data as any });
                              setEditingGoal(null);
                            }}
                            onCancel={() => setEditingGoal(null)}
                            isLoading={updateGoal.isPending}
                          />
                        </DialogContent>
                      </Dialog>

                      {/* Botão Deletar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              'Tem certeza que deseja remover esta meta? Esta ação não pode ser desfeita.'
                            )
                          ) {
                            deleteGoal.mutate(goal.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Progresso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{goal.progress_percentage}%</span>
                    </div>
                    <Progress value={goal.progress_percentage} className="h-2" />
                  </div>

                  {/* Detalhes Expandíveis */}
                  {(goal.activities ||
                    goal.materials_needed ||
                    goal.strategies ||
                    goal.success_criteria) && (
                    <div className="space-y-3 pt-4 border-t">
                      {goal.activities && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Atividades:
                          </p>
                          <p className="text-sm">{goal.activities}</p>
                        </div>
                      )}

                      {goal.materials_needed && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Materiais:
                          </p>
                          <p className="text-sm">{goal.materials_needed}</p>
                        </div>
                      )}

                      {goal.strategies && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Estratégias:
                          </p>
                          <p className="text-sm">{goal.strategies}</p>
                        </div>
                      )}

                      {goal.success_criteria && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Critérios de Sucesso:
                          </p>
                          <p className="text-sm">{goal.success_criteria}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}






























