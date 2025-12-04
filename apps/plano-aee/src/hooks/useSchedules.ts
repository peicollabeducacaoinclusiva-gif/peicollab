// ============================================================================
// HOOK: useSchedules
// ============================================================================
// Gerenciamento de cronogramas AEE integrados com cronogramas existentes
// Data: 2025-02-20
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import type {
  ServiceScheduleLink,
  CreateServiceScheduleLinkInput,
  UpdateServiceScheduleLinkInput,
  ScheduleException,
  CreateScheduleExceptionInput,
  ServiceScheduleLinkFilters,
} from '../types/schedules.types';

// ============================================================================
// HOOK: Cronogramas de Serviço AEE
// ============================================================================

export function useServiceSchedules(
  planId: string,
  filters?: ServiceScheduleLinkFilters
) {
  const queryClient = useQueryClient();

  const {
    data: schedules,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['service-schedules', planId, filters],
    queryFn: async () => {
      // Usar a view criada na migração ou fazer query direta
      const { data, error } = await supabase
        .from('aee_service_schedule_links')
        .select(`
          *,
          student:students(full_name),
          aee_teacher:profiles!aee_service_schedule_links_aee_teacher_id_fkey(full_name),
          schedule:class_schedules(
            id,
            class_id,
            academic_year,
            class:classes(class_name, grade, shift)
          )
        `)
        .eq('plan_id', planId)
        .order('start_date', { ascending: true })
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data || []).map((schedule: any) => ({
        ...schedule,
        student_name: schedule.student?.full_name,
        aee_teacher_name: schedule.aee_teacher?.full_name,
        class_name: schedule.schedule?.class?.class_name,
        class_grade: schedule.schedule?.class?.grade,
        class_shift: schedule.schedule?.class?.shift,
        academic_year: schedule.schedule?.academic_year,
      })) as ServiceScheduleLink[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });

  const createSchedule = useMutation({
    mutationFn: async (input: CreateServiceScheduleLinkInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_service_schedule_links')
        .insert({
          ...input,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ServiceScheduleLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-schedules', planId] });
      toast.success('Cronograma criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar cronograma', {
        description: error.message,
      });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateServiceScheduleLinkInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_service_schedule_links')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ServiceScheduleLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-schedules', planId] });
      toast.success('Cronograma atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar cronograma', {
        description: error.message,
      });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aee_service_schedule_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-schedules', planId] });
      toast.success('Cronograma removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover cronograma', {
        description: error.message,
      });
    },
  });

  return {
    schedules: schedules || [],
    isLoading,
    error,
    refetch,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isDeleting: deleteSchedule.isPending,
  };
}

// ============================================================================
// HOOK: Exceções de Cronograma
// ============================================================================

export function useScheduleExceptions(scheduleLinkId: string) {
  const queryClient = useQueryClient();

  const {
    data: exceptions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['schedule-exceptions', scheduleLinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aee_schedule_exceptions')
        .select('*')
        .eq('schedule_link_id', scheduleLinkId)
        .order('exception_date', { ascending: false });

      if (error) throw error;
      return (data as ScheduleException[]) || [];
    },
    enabled: !!scheduleLinkId,
    staleTime: 1000 * 60 * 5,
  });

  const createException = useMutation({
    mutationFn: async (input: CreateScheduleExceptionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_schedule_exceptions')
        .insert({
          ...input,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ScheduleException;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-exceptions', scheduleLinkId],
      });
      toast.success('Exceção criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar exceção', {
        description: error.message,
      });
    },
  });

  return {
    exceptions: exceptions || [],
    isLoading,
    error,
    refetch,
    createException,
    isCreating: createException.isPending,
  };
}

