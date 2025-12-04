/**
 * Hook para gerenciar students
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student } from '@pei/shared-types';
import {
  getStudentsBySchool,
  getStudentById,
  getStudentWithAcademic,
  getStudentsForPEI,
  createStudent,
  updateStudent,
  getStudentAcademicContext
} from '../queries/students';

/**
 * Hook para buscar alunos de uma escola
 */
export const useStudentsBySchool = (
  schoolId: string,
  filters?: Parameters<typeof getStudentsBySchool>[1]
) => {
  return useQuery({
    queryKey: ['students', 'school', schoolId, filters],
    queryFn: () => getStudentsBySchool(schoolId, filters),
    enabled: !!schoolId
  });
};

/**
 * Hook para buscar um aluno por ID
 */
export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: () => getStudentById(studentId),
    enabled: !!studentId
  });
};

/**
 * Hook para buscar aluno com contexto acadêmico
 */
export const useStudentWithAcademic = (studentId: string) => {
  return useQuery({
    queryKey: ['students', studentId, 'academic'],
    queryFn: () => getStudentWithAcademic(studentId),
    enabled: !!studentId
  });
};

/**
 * Hook para buscar alunos elegíveis para PEI
 */
export const useStudentsForPEI = (schoolId: string) => {
  return useQuery({
    queryKey: ['students', 'for-pei', schoolId],
    queryFn: () => getStudentsForPEI(schoolId),
    enabled: !!schoolId
  });
};

/**
 * Hook para buscar contexto acadêmico (frequência, notas, etc)
 */
export const useStudentAcademicContext = (studentId: string) => {
  return useQuery({
    queryKey: ['students', studentId, 'context'],
    queryFn: () => getStudentAcademicContext(studentId),
    enabled: !!studentId
  });
};

/**
 * Hook para criar aluno
 */
export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createStudent,
    onSuccess: (newStudent) => {
      // Invalidar lista de alunos da escola
      queryClient.invalidateQueries({ queryKey: ['students', 'school', newStudent.school_id] });
      queryClient.invalidateQueries({ queryKey: ['students', 'for-pei'] });
    }
  });
};

/**
 * Hook para atualizar aluno
 */
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ studentId, updates }: { 
      studentId: string; 
      updates: Partial<Omit<Student, 'id' | 'created_at'>> 
    }) => updateStudent(studentId, updates),
    onSuccess: (updatedStudent) => {
      // Atualizar cache do aluno específico
      queryClient.setQueryData(['students', updatedStudent.id], updatedStudent);
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: ['students', 'school'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'for-pei'] });
    }
  });
};

