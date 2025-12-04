import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportService } from '../services/transportService';
import { toast } from 'sonner';

interface UseTransportAttendanceFilters {
  studentId?: string;
  routeId?: string;
  startDate?: string;
  endDate?: string;
  attendanceType?: string;
}

export function useTransportAttendance(filters?: UseTransportAttendanceFilters) {
  return useQuery({
    queryKey: ['transportAttendance', filters],
    queryFn: () => transportService.getAttendance(filters),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });
}

export function useRecordTransportAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transportService.recordAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportAttendance'] });
      toast.success('Acesso registrado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registrar acesso');
    },
  });
}

