import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalsService, type Professional, type ProfessionalFilters } from '../services/professionalsService';
import { toast } from 'sonner';

export function useProfessionals(filters: ProfessionalFilters) {
  return useQuery({
    queryKey: ['professionals', filters],
    queryFn: () => professionalsService.getProfessionals(filters),
    enabled: !!filters.tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
}

export function useProfessional(professionalId: string) {
  return useQuery({
    queryKey: ['professional', professionalId],
    queryFn: () => professionalsService.getProfessionalById(professionalId),
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: professionalsService.createProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar profissional');
    },
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ professionalId, updates }: { professionalId: string; updates: Partial<Professional> }) =>
      professionalsService.updateProfessional(professionalId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['professional', variables.professionalId] });
      toast.success('Profissional atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar profissional');
    },
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: professionalsService.deleteProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional desativado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao desativar profissional');
    },
  });
}

