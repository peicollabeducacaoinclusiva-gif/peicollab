import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesService, type Class, type ClassFilters } from '../services/classesService';
import { toast } from 'sonner';

export function useClasses(filters: ClassFilters) {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: () => classesService.getClasses(filters),
    enabled: !!filters.tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: () => classesService.getClassById(classId),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar turma');
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, updates }: { classId: string; updates: Partial<Class> }) =>
      classesService.updateClass(classId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class', variables.classId] });
      toast.success('Turma atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar turma');
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma desativada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao desativar turma');
    },
  });
}

