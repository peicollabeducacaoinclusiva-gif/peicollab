import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  superfichaService,
  CompleteStudentProfile,
  RiskIndicators,
  StudentSuggestions,
  ActivityTimelineItem,
} from '../services/superfichaService';
import { toast } from 'sonner';

/**
 * Hook para buscar perfil completo do estudante
 */
export function useCompleteProfile(studentId: string | null) {
  return useQuery<CompleteStudentProfile>({
    queryKey: ['superficha', 'profile', studentId],
    queryFn: () => superfichaService.getCompleteProfile(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para buscar indicadores de risco
 */
export function useRiskIndicators(studentId: string | null) {
  return useQuery<RiskIndicators>({
    queryKey: ['superficha', 'risks', studentId],
    queryFn: () => superfichaService.getRiskIndicators(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutos (riscos mudam menos frequentemente)
    gcTime: 1000 * 60 * 60, // 1 hora
  });
}

/**
 * Hook para buscar sugestões pedagógicas
 */
export function useSuggestions(studentId: string | null) {
  return useQuery<StudentSuggestions>({
    queryKey: ['superficha', 'suggestions', studentId],
    queryFn: () => superfichaService.getSuggestions(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 15, // 15 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
  });
}

/**
 * Hook para buscar timeline de atividades
 */
export function useActivityTimeline(studentId: string | null, limit: number = 50) {
  return useQuery<ActivityTimelineItem[]>({
    queryKey: ['superficha', 'timeline', studentId, limit],
    queryFn: () => superfichaService.getActivityTimeline(studentId!, limit),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2, // 2 minutos (atividades podem mudar frequentemente)
    gcTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para atualizar campo do estudante (edição incremental)
 */
export function useUpdateStudentField(studentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fieldName, fieldValue }: { fieldName: string; fieldValue: string }) =>
      superfichaService.updateField(studentId!, fieldName, fieldValue),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['superficha', 'profile', studentId] });
      queryClient.invalidateQueries({ queryKey: ['unifiedStudent', studentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });

      toast.success('Campo atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar campo', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook para buscar todos os dados da Superficha de uma vez
 * Útil para carregamento inicial completo
 */
export function useAllSuperfichaData(studentId: string | null) {
  return useQuery({
    queryKey: ['superficha', 'all', studentId],
    queryFn: () => superfichaService.getAllSuperfichaData(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
}

