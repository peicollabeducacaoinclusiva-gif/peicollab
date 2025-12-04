import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services/mealService';
import type { MealPlan } from '../types';
import { toast } from 'sonner';

interface UseMealPlansFilters {
  schoolId?: string;
  tenantId?: string;
  status?: string;
}

export function useMealPlans(filters?: UseMealPlansFilters) {
  return useQuery({
    queryKey: ['mealPlans', filters],
    queryFn: () => mealService.getPlans(filters),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mealService.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Planejamento criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar planejamento');
    },
  });
}

export function useUpdateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, updates }: { planId: string; updates: Partial<MealPlan> }) =>
      mealService.updatePlan(planId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Planejamento atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar planejamento');
    },
  });
}

