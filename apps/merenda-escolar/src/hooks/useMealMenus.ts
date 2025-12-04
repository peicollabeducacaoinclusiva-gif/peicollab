import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services/mealService';
import type { MealMenu } from '../types';
import { toast } from 'sonner';

interface UseMealMenusFilters {
  schoolId?: string;
  tenantId?: string;
  periodStart?: string;
  periodEnd?: string;
  mealType?: string;
}

export function useMealMenus(filters?: UseMealMenusFilters) {
  return useQuery({
    queryKey: ['mealMenus', filters],
    queryFn: () => mealService.getMenus(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos (antes era cacheTime)
  });
}

export function useCreateMealMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mealService.createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealMenus'] });
      toast.success('Cardápio criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar cardápio');
    },
  });
}

export function useUpdateMealMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuId, updates }: { menuId: string; updates: Partial<MealMenu> }) =>
      mealService.updateMenu(menuId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealMenus'] });
      toast.success('Cardápio atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar cardápio');
    },
  });
}

export function useDeleteMealMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mealService.deleteMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealMenus'] });
      toast.success('Cardápio excluído com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir cardápio');
    },
  });
}

