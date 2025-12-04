import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services/mealService';
import type { MealPurchase } from '../types';
import { toast } from 'sonner';

interface UseMealPurchasesFilters {
  schoolId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}

export function useMealPurchases(filters?: UseMealPurchasesFilters) {
  return useQuery({
    queryKey: ['mealPurchases', filters],
    queryFn: () => mealService.getPurchases(filters),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateMealPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mealService.createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPurchases'] });
      toast.success('Compra registrada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registrar compra');
    },
  });
}

