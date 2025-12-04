// src/components/pei/PEIEvaluation.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, XCircle, Save } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface GoalEvaluation {
  goal_id: string;
  goal_title: string;
  status: 'achieved' | 'partial' | 'not_achieved';
  notes: string;
  percentage: number;
}

interface PEIEvaluationProps {
  peiId: string;
  evaluationId?: string | null;
  cycleNumber: number;
  cycleName: string;
  onSave?: () => void;
}

export function PEIEvaluation({
  peiId,
  evaluationId,
  cycleNumber,
  cycleName,
  onSave,
}: PEIEvaluationProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsEvaluation, setGoalsEvaluation] = useState<GoalEvaluation[]>([]);
  const [modificationsNeeded, setModificationsNeeded] = useState("");
  const [overallNotes, setOverallNotes] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [strengths, setStrengths] = useState("");
  const [challenges, setChallenges] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
    if (evaluationId) {
      loadEvaluation();
    }
  }, [peiId, evaluationId]);

  const loadGoals = async () => {
    try {
      // Carregar metas do PEI do campo planning_data
      const { data: peiData, error } = await supabase
        .from('peis')
        .select('planning_data')
        .eq('id', peiId)
        .single();

      if (error) throw error;

      const planningData = peiData.planning_data || {};
      const goalsData = planningData.goals || [];
      
      setGoals(goalsData);

      // Inicializar avaliações se não existirem
      if (!evaluationId) {
        setGoalsEvaluation(
          goalsData.map((goal: Goal) => ({
            goal_id: goal.id,
            goal_title: goal.title,
            status: 'not_achieved',
            notes: '',
            percentage: 0,
          }))
        );
      }
    } catch (error: any) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvaluation = async () => {
    if (!evaluationId) return;

    try {
      const { data, error } = await supabase
        .from('pei_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single();

      if (error) throw error;

      if (data) {
        setGoalsEvaluation(data.goals_achievement || []);
        setModificationsNeeded(data.modifications_needed || '');
        setOverallNotes(data.overall_notes || '');
        setNextSteps(data.next_steps || '');
        setStrengths(data.strengths || '');
        setChallenges(data.challenges || '');
        setRecommendations(data.recommendations || '');
      }
    } catch (error: any) {
      console.error('Erro ao carregar avaliação:', error);
    }
  };

  const updateGoalStatus = (
    goalId: string,
    status: 'achieved' | 'partial' | 'not_achieved'
  ) => {
    const percentage = status === 'achieved' ? 100 : status === 'partial' ? 50 : 0;
    setGoalsEvaluation(
      goalsEvaluation.map((ge) =>
        ge.goal_id === goalId ? { ...ge, status, percentage } : ge
      )
    );
  };

  const updateGoalNotes = (goalId: string, notes: string) => {
    setGoalsEvaluation(
      goalsEvaluation.map((ge) =>
        ge.goal_id === goalId ? { ...ge, notes } : ge
      )
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === 'achieved')
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'partial')
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      achieved: 'Alcançada',
      partial: 'Parcialmente Alcançada',
      not_achieved: 'Não Alcançada',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      achieved: 'bg-green-100 text-green-800 border-green-300',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      not_achieved: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const evaluationData = {
        pei_id: peiId,
        cycle_number: cycleNumber,
        cycle_name: cycleName,
        scheduled_date: new Date().toISOString().split('T')[0],
        goals_achievement: goalsEvaluation,
        modifications_needed: modificationsNeeded,
        overall_notes: overallNotes,
        next_steps: nextSteps,
        strengths,
        challenges,
        recommendations,
        evaluated_by: user.id,
        completed_at: new Date().toISOString(),
        is_completed: true,
      };

      if (evaluationId) {
        // Atualizar avaliação existente
        const { error } = await supabase
          .from('pei_evaluations')
          .update(evaluationData)
          .eq('id', evaluationId);

        if (error) throw error;
      } else {
        // Criar nova avaliação
        const { error } = await supabase
          .from('pei_evaluations')
          .insert([evaluationData]);

        if (error) throw error;
      }

      toast({
        title: "Avaliação salva",
        description: "A avaliação do ciclo foi registrada com sucesso!",
      });

      onSave?.();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar avaliação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma meta cadastrada para este PEI.</p>
            <p className="text-sm mt-2">
              Adicione metas ao PEI antes de realizar a avaliação.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliação - {cycleName}</CardTitle>
          <CardDescription>
            Avalie o alcance das metas estabelecidas no PEI
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Avaliação de Metas */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliação de Metas</CardTitle>
          <CardDescription>
            Marque o status de cada meta e adicione observações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {goalsEvaluation.map((goalEval, index) => {
            const goal = goals.find((g) => g.id === goalEval.goal_id);
            if (!goal) return null;

            return (
              <div
                key={goalEval.goal_id}
                className={`p-4 border-2 rounded-lg ${getStatusColor(
                  goalEval.status
                )}`}
              >
                <div className="space-y-4">
                  {/* Título da Meta */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">
                        Meta {index + 1}: {goal.title}
                      </h4>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      )}
                      {goal.category && (
                        <Badge variant="outline" className="mt-2">
                          {goal.category}
                        </Badge>
                      )}
                    </div>
                    {getStatusIcon(goalEval.status)}
                  </div>

                  {/* Status da Meta */}
                  <div className="space-y-2">
                    <Label>Status de Alcance</Label>
                    <RadioGroup
                      value={goalEval.status}
                      onValueChange={(value) =>
                        updateGoalStatus(
                          goalEval.goal_id,
                          value as 'achieved' | 'partial' | 'not_achieved'
                        )
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="achieved" id={`${goalEval.goal_id}-achieved`} />
                        <Label htmlFor={`${goalEval.goal_id}-achieved`} className="cursor-pointer">
                          <CheckCircle className="inline h-4 w-4 mr-2 text-green-600" />
                          Alcançada (100%)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partial" id={`${goalEval.goal_id}-partial`} />
                        <Label htmlFor={`${goalEval.goal_id}-partial`} className="cursor-pointer">
                          <AlertCircle className="inline h-4 w-4 mr-2 text-yellow-600" />
                          Parcialmente Alcançada (50%)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="not_achieved"
                          id={`${goalEval.goal_id}-not`}
                        />
                        <Label htmlFor={`${goalEval.goal_id}-not`} className="cursor-pointer">
                          <XCircle className="inline h-4 w-4 mr-2 text-red-600" />
                          Não Alcançada (0%)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Observações sobre a Meta */}
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${goalEval.goal_id}`}>
                      Observações sobre esta meta
                    </Label>
                    <Textarea
                      id={`notes-${goalEval.goal_id}`}
                      value={goalEval.notes}
                      onChange={(e) =>
                        updateGoalNotes(goalEval.goal_id, e.target.value)
                      }
                      placeholder="Descreva o progresso, dificuldades encontradas e ações tomadas..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Análise Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Geral do Ciclo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strengths">Pontos Fortes</Label>
            <Textarea
              id="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Descreva os pontos fortes observados no desenvolvimento do aluno..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="challenges">Desafios Encontrados</Label>
            <Textarea
              id="challenges"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Descreva os principais desafios e dificuldades..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modifications">Modificações Necessárias</Label>
            <Textarea
              id="modifications"
              value={modificationsNeeded}
              onChange={(e) => setModificationsNeeded(e.target.value)}
              placeholder="Descreva as modificações necessárias no PEI..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recomendações</Label>
            <Textarea
              id="recommendations"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Recomendações para o próximo ciclo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextSteps">Próximos Passos</Label>
            <Textarea
              id="nextSteps"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Defina os próximos passos e ações a serem tomadas..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overall">Observações Gerais</Label>
            <Textarea
              id="overall"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="Adicione observações gerais sobre o ciclo..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Avaliação'}
        </Button>
      </div>
    </div>
  );
}

