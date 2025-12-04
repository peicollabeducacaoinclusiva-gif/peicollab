import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportService } from '../services/transportService';
import type { SchoolTransport } from '../types';
import { toast } from 'sonner';

interface UseVehiclesFilters {
  schoolId?: string;
  tenantId?: string;
  activeOnly?: boolean;
}

export function useTransportVehicles(filters?: UseVehiclesFilters) {
  return useQuery({
    queryKey: ['transportVehicles', filters],
    queryFn: () => transportService.getVehicles(filters),
    enabled: !!filters?.tenantId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
}

export function useCreateTransportVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transportService.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportVehicles'] });
      toast.success('Veículo criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar veículo');
    },
  });
}

export function useUpdateTransportVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, updates }: { vehicleId: string; updates: Partial<SchoolTransport> }) =>
      transportService.updateVehicle(vehicleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportVehicles'] });
      toast.success('Veículo atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar veículo');
    },
  });
}

