/**
 * Hook para gerenciar attendance (frequência)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Attendance } from '@pei/shared-types';
import {
  getStudentAttendance,
  getClassAttendanceByDate,
  getAttendanceStats,
  createAttendance,
  createBatchAttendance,
  updateAttendance,
  getStudentsWithHighAbsence
} from '../queries/attendance';

/**
 * Hook para buscar frequência de um aluno
 */
export const useStudentAttendance = (
  studentId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ['attendance', 'student', studentId, startDate, endDate],
    queryFn: () => getStudentAttendance(studentId, startDate, endDate),
    enabled: !!studentId && !!startDate && !!endDate
  });
};

/**
 * Hook para buscar frequência de uma turma em uma data
 */
export const useClassAttendanceByDate = (
  classId: string,
  date: string,
  subjectId?: string
) => {
  return useQuery({
    queryKey: ['attendance', 'class', classId, date, subjectId],
    queryFn: () => getClassAttendanceByDate(classId, date, subjectId),
    enabled: !!classId && !!date
  });
};

/**
 * Hook para estatísticas de frequência
 */
export const useAttendanceStats = (studentId: string, daysBack: number = 30) => {
  return useQuery({
    queryKey: ['attendance', 'stats', studentId, daysBack],
    queryFn: () => getAttendanceStats(studentId, daysBack),
    enabled: !!studentId
  });
};

/**
 * Hook para buscar alunos com faltas acumuladas
 */
export const useStudentsWithHighAbsence = (schoolId: string, minFaltas: number = 5) => {
  return useQuery({
    queryKey: ['attendance', 'high-absence', schoolId, minFaltas],
    queryFn: () => getStudentsWithHighAbsence(schoolId, minFaltas),
    enabled: !!schoolId
  });
};

/**
 * Hook para registrar frequência
 */
export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAttendance,
    onSuccess: (newAttendance) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['attendance', 'student', newAttendance.student_id] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', newAttendance.class_id] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats', newAttendance.student_id] });
    }
  });
};

/**
 * Hook para registrar frequência em lote (diário de classe)
 */
export const useCreateBatchAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBatchAttendance,
    onSuccess: (attendances) => {
      if (attendances.length > 0 && attendances[0]) {
        const classId = attendances[0].class_id;
        const date = attendances[0].data;
        
        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: ['attendance', 'class', classId, date] });
        attendances.forEach(a => {
          queryClient.invalidateQueries({ queryKey: ['attendance', 'student', a.student_id] });
          queryClient.invalidateQueries({ queryKey: ['attendance', 'stats', a.student_id] });
        });
      }
    }
  });
};

/**
 * Hook para atualizar frequência
 */
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ attendanceId, updates }: {
      attendanceId: string;
      updates: Partial<Omit<Attendance, 'id' | 'student_id' | 'data' | 'created_at'>>;
    }) => updateAttendance(attendanceId, updates),
    onSuccess: (updatedAttendance) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats', updatedAttendance.student_id] });
    }
  });
};

