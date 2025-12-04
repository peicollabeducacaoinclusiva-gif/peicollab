import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services/mealService';
import type { MealSupplier } from '../types';
import { toast } from 'sonner';

export function useMealSuppliers(tenantId: string, activeOnly = true) {
  return useQuery({
    queryKey: ['mealSuppliers', tenantId, activeOnly],
    queryFn: () => mealService.getSuppliers(tenantId, activeOnly),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10, // 10 minutos (fornecedores mudam menos)
    gcTime: 1000 * 60 * 60, // 1 hora
  });
}

export function useCreateMealSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mealService.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSuppliers'] });
      toast.success('Fornecedor criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar fornecedor');
    },
  });
}

export function useUpdateMealSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, updates }: { supplierId: string; updates: Partial<MealSupplier> }) =>
      mealService.updateSupplier(supplierId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSuppliers'] });
      toast.success('Fornecedor atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar fornecedor');
    },
  });
}

