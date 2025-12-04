import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportService } from '../services/transportService';
import type { StudentTransport } from '../types';
import { toast } from 'sonner';

interface UseStudentTransportFilters {
  studentId?: string;
  routeId?: string;
  schoolId?: string;
  academicYear?: number;
  activeOnly?: boolean;
}

export function useStudentTransport(filters?: UseStudentTransportFilters) {
  return useQuery({
    queryKey: ['studentTransport', filters],
    queryFn: () => transportService.getStudentAssignments(filters),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useAssignStudentToRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transportService.assignStudentToRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTransport'] });
      toast.success('Aluno vinculado à rota com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao vincular aluno');
    },
  });
}

export function useUpdateStudentTransport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, updates }: { assignmentId: string; updates: Partial<StudentTransport> }) =>
      transportService.updateStudentAssignment(assignmentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTransport'] });
      toast.success('Vínculo atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar vínculo');
    },
  });
}

