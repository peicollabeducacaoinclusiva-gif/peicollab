import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesService, type Class, type ClassFilters } from '../services/classesService';
import { toast } from 'sonner';

export function useClasses(filters: ClassFilters) {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: async () => {
      try {
        return await classesService.getClasses(filters);
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        throw error;
      }
    },
    enabled: !!filters.tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: 1,
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
    mutationFn: async (classData: Partial<Class>) => {
      try {
        return await classesService.createClass(classData);
      } catch (error: any) {
        console.error('Erro ao criar turma:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma criada com sucesso');
    },
    onError: (error: any) => {
      const message = error?.message || error?.error?.message || 'Erro ao criar turma';
      toast.error(message);
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, updates }: { classId: string; updates: Partial<Class> }) => {
      try {
        return await classesService.updateClass(classId, updates);
      } catch (error: any) {
        console.error('Erro ao atualizar turma:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class', variables.classId] });
      toast.success('Turma atualizada com sucesso');
    },
    onError: (error: any) => {
      const message = error?.message || error?.error?.message || 'Erro ao atualizar turma';
      toast.error(message);
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classId: string) => {
      try {
        return await classesService.deleteClass(classId);
      } catch (error: any) {
        console.error('Erro ao desativar turma:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma desativada com sucesso');
    },
    onError: (error: any) => {
      const message = error?.message || error?.error?.message || 'Erro ao desativar turma';
      toast.error(message);
    },
  });
}

