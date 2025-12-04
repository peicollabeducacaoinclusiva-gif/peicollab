import { useQuery } from '@tanstack/react-query';
import {
  unifiedStudentService,
  UnifiedStudentData,
  StudentHistory,
  StudentNEE,
  StudentDocument,
  StudentAccessibility,
} from '../services/unifiedStudentService';

export function useUnifiedStudent(studentId: string | null) {
  return useQuery<UnifiedStudentData>({
    queryKey: ['unifiedStudent', studentId],
    queryFn: () => unifiedStudentService.getUnifiedStudentData(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useStudentHistory(studentId: string | null) {
  return useQuery<StudentHistory[]>({
    queryKey: ['studentHistory', studentId],
    queryFn: () => unifiedStudentService.getStudentHistory(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

export function useStudentNEE(studentId: string | null) {
  return useQuery<StudentNEE>({
    queryKey: ['studentNEE', studentId],
    queryFn: () => unifiedStudentService.getStudentNEE(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useStudentDocuments(studentId: string | null) {
  return useQuery<StudentDocument[]>({
    queryKey: ['studentDocuments', studentId],
    queryFn: () => unifiedStudentService.getStudentDocuments(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useStudentAccessibility(studentId: string | null) {
  return useQuery<StudentAccessibility>({
    queryKey: ['studentAccessibility', studentId],
    queryFn: () => unifiedStudentService.getStudentAccessibility(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

