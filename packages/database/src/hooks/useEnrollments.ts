/**
 * Hook para gerenciar enrollments (matrículas)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Enrollment } from '@pei/shared-types';
import {
  getEnrollmentsBySchool,
  getActiveEnrollment,
  getEnrollmentsByClass,
  createEnrollment,
  updateEnrollmentStatus,
  transferStudent
} from '../queries/enrollments';

/**
 * Hook para buscar matrículas de uma escola
 */
export const useEnrollmentsBySchool = (
  schoolId: string,
  filters?: Parameters<typeof getEnrollmentsBySchool>[1]
) => {
  return useQuery({
    queryKey: ['enrollments', 'school', schoolId, filters],
    queryFn: () => getEnrollmentsBySchool(schoolId, filters),
    enabled: !!schoolId
  });
};

/**
 * Hook para buscar matrícula ativa de um aluno
 */
export const useActiveEnrollment = (studentId: string) => {
  return useQuery({
    queryKey: ['enrollments', 'student', studentId, 'active'],
    queryFn: () => getActiveEnrollment(studentId),
    enabled: !!studentId
  });
};

/**
 * Hook para buscar alunos matriculados em uma turma
 */
export const useEnrollmentsByClass = (classId: string) => {
  return useQuery({
    queryKey: ['enrollments', 'class', classId],
    queryFn: () => getEnrollmentsByClass(classId),
    enabled: !!classId
  });
};

/**
 * Hook para criar matrícula
 */
export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEnrollment,
    onSuccess: (newEnrollment) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'school', newEnrollment.school_id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'class', newEnrollment.class_id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'student', newEnrollment.student_id] });
    }
  });
};

/**
 * Hook para atualizar status de matrícula
 */
export const useUpdateEnrollmentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ enrollmentId, status, motivoSaida }: {
      enrollmentId: string;
      status: Enrollment['status'];
      motivoSaida?: string;
    }) => updateEnrollmentStatus(enrollmentId, status, motivoSaida),
    onSuccess: (updatedEnrollment) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['students', updatedEnrollment.student_id] });
    }
  });
};

/**
 * Hook para transferir aluno de turma
 */
export const useTransferStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ studentId, newClassId, anoLetivo }: {
      studentId: string;
      newClassId: string;
      anoLetivo: number;
    }) => transferStudent(studentId, newClassId, anoLetivo),
    onSuccess: (newEnrollment) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['students', newEnrollment.student_id] });
    }
  });
};

