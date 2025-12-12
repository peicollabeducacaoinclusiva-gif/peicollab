import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService, type Student, type StudentFilters } from '../services/studentsService';
import { toast } from 'sonner';

export function useStudents(filters: StudentFilters) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      try {
        return await studentsService.getStudents(filters);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        throw error;
      }
    },
    enabled: !!filters.tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: 1,
  });
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsService.getStudentById(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentData: Partial<Student>) => {
      try {
        return await studentsService.createStudent(studentData);
      } catch (error: any) {
        console.error('Erro ao criar aluno:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno criado com sucesso');
    },
    onError: (error: any) => {
      const message = error?.message || error?.error?.message || 'Erro ao criar aluno';
      toast.error(message);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, updates }: { studentId: string; updates: Partial<Student> }) => {
      try {
        return await studentsService.updateStudent(studentId, updates);
      } catch (error: any) {
        console.error('Erro ao atualizar aluno:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
      toast.success('Aluno atualizado com sucesso');
    },
    onError: (error: any) => {
      const message = error?.message || error?.error?.message || 'Erro ao atualizar aluno';
      toast.error(message);
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      try {
        return await studentsService.deleteStudent(studentId);
      } catch (error: any) {
        console.error('Erro ao desativar aluno:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno desativado com sucesso');
    },
    onError: (error: any) => {
      const message = error?.message || error?.error?.message || 'Erro ao desativar aluno';
      toast.error(message);
    },
  });
}

export function useSchools(tenantId: string) {
  return useQuery({
    queryKey: ['schools', tenantId],
    queryFn: () => studentsService.getSchools(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10, // 10 minutos (escolas mudam pouco)
    gcTime: 1000 * 60 * 60, // 1 hora
  });
}




