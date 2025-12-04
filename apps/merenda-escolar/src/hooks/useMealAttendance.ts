import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services/mealService';
import { toast } from 'sonner';

interface UseMealAttendanceFilters {
  schoolId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  mealType?: string;
}

export function useMealAttendance(filters?: UseMealAttendanceFilters) {
  return useQuery({
    queryKey: ['mealAttendance', filters],
    queryFn: () => mealService.getAttendance(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos (presenças mudam frequentemente)
    gcTime: 1000 * 60 * 15,
  });
}

export function useRecordMealConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mealService.recordConsumption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealAttendance'] });
      toast.success('Consumo registrado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registrar consumo');
    },
  });
}

