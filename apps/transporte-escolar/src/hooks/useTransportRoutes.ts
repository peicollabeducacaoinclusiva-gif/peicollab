import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportService } from '../services/transportService';
import type { TransportRoute } from '../types';
import { toast } from 'sonner';

export function useTransportRoutes(schoolId: string, activeOnly = true) {
  return useQuery({
    queryKey: ['transportRoutes', schoolId, activeOnly],
    queryFn: () => transportService.getRoutes(schoolId, activeOnly),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateTransportRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transportService.createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
      toast.success('Rota criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar rota');
    },
  });
}

export function useUpdateTransportRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, updates }: { routeId: string; updates: Partial<TransportRoute> }) =>
      transportService.updateRoute(routeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
      toast.success('Rota atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar rota');
    },
  });
}

