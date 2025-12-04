import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService, type Student, type StudentFilters } from '../services/studentsService';
import { toast } from 'sonner';

export function useStudents(filters: StudentFilters) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentsService.getStudents(filters),
    enabled: !!filters.tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
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
    mutationFn: studentsService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar aluno');
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, updates }: { studentId: string; updates: Partial<Student> }) =>
      studentsService.updateStudent(studentId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
      toast.success('Aluno atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar aluno');
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentsService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno desativado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao desativar aluno');
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




