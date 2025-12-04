/**
 * Hook para gerenciar grades (notas)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Grade, Periodo } from '@pei/shared-types';
import {
  getGradesByPeriod,
  getAllGradesByEnrollment,
  getBoletim,
  createGrade,
  updateGrade,
  approveGrade
} from '../queries/grades';

/**
 * Hook para buscar notas de um período
 */
export const useGradesByPeriod = (enrollmentId: string, periodo: Periodo) => {
  return useQuery({
    queryKey: ['grades', 'enrollment', enrollmentId, 'period', periodo],
    queryFn: () => getGradesByPeriod(enrollmentId, periodo),
    enabled: !!enrollmentId && !!periodo
  });
};

/**
 * Hook para buscar todas as notas de uma matrícula
 */
export const useAllGrades = (enrollmentId: string) => {
  return useQuery({
    queryKey: ['grades', 'enrollment', enrollmentId, 'all'],
    queryFn: () => getAllGradesByEnrollment(enrollmentId),
    enabled: !!enrollmentId
  });
};

/**
 * Hook para buscar boletim completo
 */
export const useBoletim = (enrollmentId: string, studentId: string) => {
  return useQuery({
    queryKey: ['grades', 'boletim', enrollmentId],
    queryFn: () => getBoletim(enrollmentId, studentId),
    enabled: !!enrollmentId && !!studentId
  });
};

/**
 * Hook para criar nota
 */
export const useCreateGrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createGrade,
    onSuccess: (newGrade) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['grades', 'enrollment', newGrade.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'boletim'] });
    }
  });
};

/**
 * Hook para atualizar nota
 */
export const useUpdateGrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gradeId, updates }: {
      gradeId: string;
      updates: Partial<Omit<Grade, 'id' | 'enrollment_id' | 'created_at'>>;
    }) => updateGrade(gradeId, updates),
    onSuccess: (updatedGrade) => {
      queryClient.setQueryData(['grades', updatedGrade.id], updatedGrade);
      queryClient.invalidateQueries({ queryKey: ['grades', 'enrollment', updatedGrade.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'boletim'] });
    }
  });
};

/**
 * Hook para aprovar nota (coordenação)
 */
export const useApproveGrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gradeId, approvedBy }: { gradeId: string; approvedBy: string }) =>
      approveGrade(gradeId, approvedBy),
    onSuccess: (approvedGrade) => {
      queryClient.setQueryData(['grades', approvedGrade.id], approvedGrade);
      queryClient.invalidateQueries({ queryKey: ['grades', 'enrollment', approvedGrade.enrollment_id] });
    }
  });
};

