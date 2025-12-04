// ============================================================================
// HOOK: usePlanGoals
// ============================================================================
// Gerenciar metas SMART do plano de AEE com React Query
// Data: 2025-01-09
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import type {
  PlanGoal,
  CreatePlanGoalInput,
  UpdatePlanGoalInput,
  GoalsFilters,
  GoalsStatistics,
} from '../types/planoAEE.types';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function usePlanGoals(planId: string, filters?: GoalsFilters) {
  const queryClient = useQueryClient();

  // ============================================================================
  // QUERY: Buscar metas do plano
  // ============================================================================

  const {
    data: goals,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['plan-goals', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_plan_goals')
        .select('*')
        .eq('plan_id', planId)
        .order('priority', { ascending: false }) // Alta prioridade primeiro
        .order('created_at', { ascending: true });

      // Aplicar filtros
      if (filters?.goal_area) {
        query = query.eq('goal_area', filters.goal_area);
      }
      if (filters?.progress_status) {
        query = query.eq('progress_status', filters.progress_status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as PlanGoal[]) || [];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // ============================================================================
  // MUTATION: Criar meta
  // ============================================================================

  const createGoal = useMutation({
    mutationFn: async (input: CreatePlanGoalInput) => {
      const { data, error } = await supabase
        .from('aee_plan_goals')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as PlanGoal;
    },
    onSuccess: (newGoal) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['plan-goals', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-statistics', planId] });

      toast.success('Meta criada com sucesso!', {
        description: `Meta: ${newGoal.goal_description.substring(0, 50)}...`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar meta', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // MUTATION: Atualizar meta
  // ============================================================================

  const updateGoal = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePlanGoalInput }) => {
      const { data, error } = await supabase
        .from('aee_plan_goals')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PlanGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-goals', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-statistics', planId] });

      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar meta', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // MUTATION: Deletar meta
  // ============================================================================

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('aee_plan_goals').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-goals', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-statistics', planId] });

      toast.success('Meta removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover meta', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // FUNÇÃO AUXILIAR: Atualizar progresso manualmente
  // ============================================================================

  const updateProgress = (goalId: string, percentage: number) => {
    const status =
      percentage >= 100
        ? 'alcancada'
        : percentage >= 50
        ? 'em_andamento'
        : 'nao_iniciada';

    return updateGoal.mutate({
      id: goalId,
      input: {
        progress_percentage: percentage,
        progress_status: status,
      },
    });
  };

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  const statistics: GoalsStatistics = {
    total: goals?.length || 0,
    achieved: goals?.filter((g) => g.progress_status === 'alcancada').length || 0,
    in_progress: goals?.filter((g) => g.progress_status === 'em_andamento').length || 0,
    not_started: goals?.filter((g) => g.progress_status === 'nao_iniciada').length || 0,
    partially_achieved:
      goals?.filter((g) => g.progress_status === 'parcialmente_alcancada').length || 0,
    cancelled: goals?.filter((g) => g.progress_status === 'cancelada').length || 0,
    high_priority: goals?.filter((g) => g.priority === 'alta').length || 0,
    by_area: {
      percepcao: goals?.filter((g) => g.goal_area === 'percepcao').length || 0,
      linguagem: goals?.filter((g) => g.goal_area === 'linguagem').length || 0,
      motora: goals?.filter((g) => g.goal_area === 'motora').length || 0,
      socio_emocional: goals?.filter((g) => g.goal_area === 'socio_emocional').length || 0,
      autonomia: goals?.filter((g) => g.goal_area === 'autonomia').length || 0,
      academica: goals?.filter((g) => g.goal_area === 'academica').length || 0,
      geral: goals?.filter((g) => g.goal_area === 'geral').length || 0,
    },
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Dados
    goals: goals || [],
    isLoading,
    error,

    // Ações
    refetch,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,

    // Estatísticas
    statistics,

    // Estados de loading
    isCreating: createGoal.isPending,
    isUpdating: updateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
}






























