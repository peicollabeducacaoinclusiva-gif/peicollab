// ============================================================================
// HOOK: useCommunication
// ============================================================================
// Gerenciamento de comunicação entre professores e monitoramento
// Data: 2025-02-20
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import type {
  TeacherCommunication,
  CreateTeacherCommunicationInput,
  UpdateTeacherCommunicationInput,
  LearningRepertoire,
  CreateLearningRepertoireInput,
  UpdateLearningRepertoireInput,
  ProgressTracking,
  CreateProgressTrackingInput,
  UpdateProgressTrackingInput,
  TeacherCommunicationFilters,
  LearningRepertoireFilters,
  ProgressTrackingFilters,
  UnreadMessage,
} from '../types/communication.types';

// ============================================================================
// HOOK: Comunicação entre Professores
// ============================================================================

export function useTeacherCommunication(
  planId: string,
  filters?: TeacherCommunicationFilters
) {
  const queryClient = useQueryClient();

  const {
    data: messages,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teacher-communication', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_teacher_communication')
        .select(`
          *,
          from_user:profiles!aee_teacher_communication_from_user_id_fkey(full_name),
          to_user:profiles!aee_teacher_communication_to_user_id_fkey(full_name)
        `)
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (filters?.from_user_id) {
        query = query.eq('from_user_id', filters.from_user_id);
      }
      if (filters?.to_user_id) {
        query = query.eq('to_user_id', filters.to_user_id);
      }
      if (filters?.communication_type) {
        query = query.eq('communication_type', filters.communication_type);
      }
      if (filters?.read_status !== undefined) {
        query = query.eq('read_status', filters.read_status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((msg: any) => ({
        ...msg,
        from_user_name: msg.from_user?.full_name,
        to_user_name: msg.to_user?.full_name,
      })) as TeacherCommunication[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 2, // 2 minutos (comunicação precisa ser mais atualizada)
  });

  const createMessage = useMutation({
    mutationFn: async (input: CreateTeacherCommunicationInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_teacher_communication')
        .insert({
          ...input,
          from_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TeacherCommunication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-communication', planId] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
      toast.success('Mensagem enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar mensagem', {
        description: error.message,
      });
    },
  });

  const updateMessage = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTeacherCommunicationInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_teacher_communication')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TeacherCommunication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-communication', planId] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
      toast.success('Mensagem atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar mensagem', {
        description: error.message,
      });
    },
  });

  // Buscar mensagens não lidas
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('count_unread_messages', {
        p_user_id: user.id,
      });

      if (error) {
        // Fallback: contar manualmente
        const { count } = await supabase
          .from('aee_teacher_communication')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', user.id)
          .eq('read_status', false);

        return count || 0;
      }

      return data || 0;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  return {
    messages: messages || [],
    isLoading,
    error,
    refetch,
    createMessage,
    updateMessage,
    unreadCount: unreadCount || 0,
    isCreating: createMessage.isPending,
    isUpdating: updateMessage.isPending,
  };
}

// ============================================================================
// HOOK: Repertório de Aprendizagem
// ============================================================================

export function useLearningRepertoire(
  studentId: string,
  planId: string,
  filters?: LearningRepertoireFilters
) {
  const queryClient = useQueryClient();

  const {
    data: repertoire,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['learning-repertoire', studentId, planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_learning_repertoire')
        .select(`
          *,
          recorded_by_user:profiles!aee_learning_repertoire_recorded_by_fkey(full_name)
        `)
        .eq('student_id', studentId)
        .eq('plan_id', planId)
        .order('record_date', { ascending: false })
        .limit(1); // Pegar o mais recente

      if (filters?.record_type) {
        query = query.eq('record_type', filters.record_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data?.[0] || null) as LearningRepertoire | null;
    },
    enabled: !!studentId && !!planId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  const createRepertoire = useMutation({
    mutationFn: async (input: CreateLearningRepertoireInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_learning_repertoire')
        .insert({
          ...input,
          recorded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LearningRepertoire;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['learning-repertoire', studentId, planId],
      });
      toast.success('Repertório registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar repertório', {
        description: error.message,
      });
    },
  });

  const updateRepertoire = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateLearningRepertoireInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_learning_repertoire')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LearningRepertoire;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['learning-repertoire', studentId, planId],
      });
      toast.success('Repertório atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar repertório', {
        description: error.message,
      });
    },
  });

  return {
    repertoire,
    isLoading,
    error,
    refetch,
    createRepertoire,
    updateRepertoire,
    isCreating: createRepertoire.isPending,
    isUpdating: updateRepertoire.isPending,
  };
}

// ============================================================================
// HOOK: Monitoramento de Progresso
// ============================================================================

export function useProgressTracking(
  planId: string,
  filters?: ProgressTrackingFilters
) {
  const queryClient = useQueryClient();

  const {
    data: tracking,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['progress-tracking', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_progress_tracking')
        .select(`
          *,
          student:students(full_name),
          tracker:profiles!aee_progress_tracking_tracker_id_fkey(full_name)
        `)
        .eq('plan_id', planId)
        .order('tracking_date', { ascending: false });

      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters?.metric_type) {
        query = query.eq('metric_type', filters.metric_type);
      }
      if (filters?.trend) {
        query = query.eq('trend', filters.trend);
      }
      if (filters?.date_from) {
        query = query.gte('tracking_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('tracking_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((t: any) => ({
        ...t,
        student_name: t.student?.full_name,
        tracker_name: t.tracker?.full_name,
      })) as ProgressTracking[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });

  const createTracking = useMutation({
    mutationFn: async (input: CreateProgressTrackingInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_progress_tracking')
        .insert({
          ...input,
          tracker_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProgressTracking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-tracking', planId] });
      toast.success('Registro de progresso criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar registro de progresso', {
        description: error.message,
      });
    },
  });

  const updateTracking = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateProgressTrackingInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_progress_tracking')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProgressTracking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-tracking', planId] });
      toast.success('Registro atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar registro', {
        description: error.message,
      });
    },
  });

  return {
    tracking: tracking || [],
    isLoading,
    error,
    refetch,
    createTracking,
    updateTracking,
    isCreating: createTracking.isPending,
    isUpdating: updateTracking.isPending,
  };
}

