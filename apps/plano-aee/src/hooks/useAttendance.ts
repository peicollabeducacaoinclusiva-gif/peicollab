// ============================================================================
// HOOK: useAttendance
// ============================================================================
// Gerenciar registro de atendimentos com React Query
// Data: 2025-01-09
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import type {
  AttendanceRecord,
  CreateAttendanceInput,
  UpdateAttendanceInput,
  AttendanceFilters,
  AttendanceStatistics,
} from '../types/planoAEE.types';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useAttendance(filters: AttendanceFilters) {
  const queryClient = useQueryClient();

  // ============================================================================
  // QUERY: Buscar atendimentos
  // ============================================================================

  const {
    data: attendances,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['attendances', filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_attendance_records')
        .select('*')
        .order('attendance_date', { ascending: false });

      // Aplicar filtros
      if (filters.plan_id) {
        query = query.eq('plan_id', filters.plan_id);
      }
      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters.teacher_id) {
        query = query.eq('teacher_id', filters.teacher_id);
      }
      if (filters.date_from) {
        query = query.gte('attendance_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('attendance_date', filters.date_to);
      }
      if (filters.attendance_status) {
        query = query.eq('attendance_status', filters.attendance_status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as AttendanceRecord[]) || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // ============================================================================
  // MUTATION: Registrar atendimento
  // ============================================================================

  const recordAttendance = useMutation({
    mutationFn: async (input: CreateAttendanceInput) => {
      // Obter ID do professor logado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_attendance_records')
        .insert({
          ...input,
          teacher_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: (newAttendance) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['plan-goals'] }); // Atualiza progresso
      queryClient.invalidateQueries({ queryKey: ['plan-statistics'] });

      toast.success('Atendimento registrado!', {
        description: `Status: ${newAttendance.attendance_status}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar atendimento', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // MUTATION: Atualizar atendimento
  // ============================================================================

  const updateAttendance = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAttendanceInput }) => {
      const { data, error } = await supabase
        .from('aee_attendance_records')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['plan-goals'] });
      queryClient.invalidateQueries({ queryKey: ['plan-statistics'] });

      toast.success('Atendimento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar atendimento', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // MUTATION: Deletar atendimento
  // ============================================================================

  const deleteAttendance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('aee_attendance_records').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['plan-goals'] });
      queryClient.invalidateQueries({ queryKey: ['plan-statistics'] });

      toast.success('Atendimento removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover atendimento', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  const statistics: AttendanceStatistics = {
    total: attendances?.length || 0,
    presente: attendances?.filter((a) => a.attendance_status === 'presente').length || 0,
    faltas_justificadas:
      attendances?.filter((a) => a.attendance_status === 'falta_justificada').length || 0,
    faltas_injustificadas:
      attendances?.filter((a) => a.attendance_status === 'falta_injustificada').length || 0,
    remarcados: attendances?.filter((a) => a.attendance_status === 'remarcado').length || 0,
    attendance_rate: attendances?.length
      ? (attendances.filter((a) => a.attendance_status === 'presente').length /
          attendances.length) *
        100
      : 0,
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  // Buscar atendimentos de uma data específica
  const getAttendancesByDate = (date: string) => {
    return attendances?.filter((a) => a.attendance_date === date) || [];
  };

  // Buscar último atendimento
  const getLastAttendance = () => {
    return attendances?.[0] || null;
  };

  // Verificar se tem atendimento hoje
  const hasTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendances?.some((a) => a.attendance_date === today) || false;
  };

  // Verificar baixa frequência (< 75%)
  const isLowAttendance = () => {
    return statistics.attendance_rate < 75;
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Dados
    attendances: attendances || [],
    isLoading,
    error,

    // Ações
    refetch,
    recordAttendance,
    updateAttendance,
    deleteAttendance,

    // Estatísticas
    statistics,

    // Funções auxiliares
    getAttendancesByDate,
    getLastAttendance,
    hasTodayAttendance,
    isLowAttendance,

    // Estados de loading
    isRecording: recordAttendance.isPending,
    isUpdating: updateAttendance.isPending,
    isDeleting: deleteAttendance.isPending,
  };
}






























