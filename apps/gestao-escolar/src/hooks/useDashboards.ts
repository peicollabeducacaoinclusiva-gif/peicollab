import { useQuery } from '@tanstack/react-query';
import {
  dashboardService,
  AttendanceMetrics,
  StudentAtRisk,
  ClassEvolution,
  InclusionMetrics,
} from '../services/dashboardService';

/**
 * Hook para métricas de frequência
 */
export function useSchoolAttendanceMetrics(
  schoolId: string | null,
  periodStart?: string,
  periodEnd?: string
) {
  return useQuery<AttendanceMetrics>({
    queryKey: ['dashboard', 'attendance', schoolId, periodStart, periodEnd],
    queryFn: () =>
      dashboardService.getSchoolAttendanceMetrics(schoolId!, periodStart, periodEnd),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para alunos com risco
 */
export function useStudentsAtRisk(
  filters?: {
    schoolId?: string;
    tenantId?: string;
    riskType?: 'all' | 'attendance' | 'grades' | 'inclusion';
  }
) {
  return useQuery<StudentAtRisk[]>({
    queryKey: ['dashboard', 'students-at-risk', filters],
    queryFn: () =>
      dashboardService.getStudentsAtRisk(
        filters?.schoolId,
        filters?.tenantId,
        filters?.riskType || 'all'
      ),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para evolução das turmas
 */
export function useClassEvolution(
  schoolId: string | null,
  periodStart?: string,
  periodEnd?: string
) {
  return useQuery<ClassEvolution[]>({
    queryKey: ['dashboard', 'class-evolution', schoolId, periodStart, periodEnd],
    queryFn: () =>
      dashboardService.getClassEvolution(schoolId!, periodStart, periodEnd),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para indicadores de inclusão
 */
export function useInclusionMetrics(
  filters?: {
    schoolId?: string;
    tenantId?: string;
  }
) {
  return useQuery<InclusionMetrics>({
    queryKey: ['dashboard', 'inclusion', filters],
    queryFn: () => dashboardService.getInclusionMetrics(filters?.schoolId, filters?.tenantId),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

