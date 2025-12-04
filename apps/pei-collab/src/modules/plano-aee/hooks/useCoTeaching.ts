// ============================================================================
// HOOK: useCoTeaching
// ============================================================================
// Gerenciamento de co-ensino entre professor AEE e professor regular
// Data: 2025-02-20
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import type {
  CoTeachingSession,
  CreateCoTeachingSessionInput,
  UpdateCoTeachingSessionInput,
  LessonPlan,
  CreateLessonPlanInput,
  UpdateLessonPlanInput,
  CoTeachingParticipant,
  AddParticipantInput,
  CoTeachingSessionFilters,
} from '../types/coTeaching.types';

// ============================================================================
// HOOK PRINCIPAL: Sessões de Co-ensino
// ============================================================================

export function useCoTeachingSessions(
  planId: string,
  filters?: CoTeachingSessionFilters
) {
  const queryClient = useQueryClient();

  // ============================================================================
  // QUERY: Buscar sessões de co-ensino
  // ============================================================================

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['co-teaching-sessions', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_co_teaching_sessions')
        .select(`
          *,
          regular_teacher:profiles!aee_co_teaching_sessions_regular_teacher_id_fkey(full_name),
          aee_teacher:profiles!aee_co_teaching_sessions_aee_teacher_id_fkey(full_name),
          student:students(full_name),
          class:classes(class_name)
        `)
        .eq('plan_id', planId)
        .order('session_date', { ascending: false })
        .order('start_time', { ascending: true });

      // Aplicar filtros
      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters?.class_id) {
        query = query.eq('class_id', filters.class_id);
      }
      if (filters?.regular_teacher_id) {
        query = query.eq('regular_teacher_id', filters.regular_teacher_id);
      }
      if (filters?.aee_teacher_id) {
        query = query.eq('aee_teacher_id', filters.aee_teacher_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('session_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('session_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear dados para o formato esperado
      return (data || []).map((session: any) => ({
        ...session,
        regular_teacher_name: session.regular_teacher?.full_name,
        aee_teacher_name: session.aee_teacher?.full_name,
        student_name: session.student?.full_name,
        class_name: session.class?.class_name,
      })) as CoTeachingSession[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // ============================================================================
  // MUTATION: Criar sessão de co-ensino
  // ============================================================================

  const createSession = useMutation({
    mutationFn: async (input: CreateCoTeachingSessionInput) => {
      const { data, error } = await supabase
        .from('aee_co_teaching_sessions')
        .insert({
          ...input,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CoTeachingSession;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['co-teaching-sessions', planId] });
      toast.success('Sessão de co-ensino criada com sucesso!', {
        description: `Data: ${new Date(newSession.session_date).toLocaleDateString('pt-BR')}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar sessão de co-ensino', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // MUTATION: Atualizar sessão de co-ensino
  // ============================================================================

  const updateSession = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateCoTeachingSessionInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_co_teaching_sessions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CoTeachingSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['co-teaching-sessions', planId] });
      toast.success('Sessão atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar sessão', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // MUTATION: Deletar sessão de co-ensino
  // ============================================================================

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aee_co_teaching_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['co-teaching-sessions', planId] });
      toast.success('Sessão removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover sessão', {
        description: error.message,
      });
    },
  });

  return {
    sessions: sessions || [],
    isLoading,
    error,
    refetch,
    createSession,
    updateSession,
    deleteSession,
    isCreating: createSession.isPending,
    isUpdating: updateSession.isPending,
    isDeleting: deleteSession.isPending,
  };
}

// ============================================================================
// HOOK: Planos de Aula
// ============================================================================

export function useLessonPlans(planId: string) {
  const queryClient = useQueryClient();

  const {
    data: lessonPlans,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lesson-plans', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aee_lesson_plans')
        .select('*')
        .eq('plan_id', planId)
        .order('planned_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as LessonPlan[]) || [];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });

  const createLessonPlan = useMutation({
    mutationFn: async (input: CreateLessonPlanInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_lesson_plans')
        .insert({
          ...input,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LessonPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans', planId] });
      toast.success('Plano de aula criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar plano de aula', {
        description: error.message,
      });
    },
  });

  const updateLessonPlan = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateLessonPlanInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_lesson_plans')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LessonPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans', planId] });
      toast.success('Plano de aula atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar plano de aula', {
        description: error.message,
      });
    },
  });

  const deleteLessonPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aee_lesson_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans', planId] });
      toast.success('Plano de aula removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover plano de aula', {
        description: error.message,
      });
    },
  });

  return {
    lessonPlans: lessonPlans || [],
    isLoading,
    error,
    refetch,
    createLessonPlan,
    updateLessonPlan,
    deleteLessonPlan,
    isCreating: createLessonPlan.isPending,
    isUpdating: updateLessonPlan.isPending,
    isDeleting: deleteLessonPlan.isPending,
  };
}

// ============================================================================
// HOOK: Participantes
// ============================================================================

export function useCoTeachingParticipants(sessionId: string) {
  const queryClient = useQueryClient();

  const {
    data: participants,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['co-teaching-participants', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aee_co_teaching_participants')
        .select(`
          *,
          user:profiles(full_name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        user_name: p.user?.full_name,
      })) as CoTeachingParticipant[];
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5,
  });

  const addParticipant = useMutation({
    mutationFn: async (input: AddParticipantInput) => {
      const { data, error } = await supabase
        .from('aee_co_teaching_participants')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as CoTeachingParticipant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['co-teaching-participants', sessionId],
      });
      toast.success('Participante adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar participante', {
        description: error.message,
      });
    },
  });

  const removeParticipant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aee_co_teaching_participants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['co-teaching-participants', sessionId],
      });
      toast.success('Participante removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover participante', {
        description: error.message,
      });
    },
  });

  return {
    participants: participants || [],
    isLoading,
    error,
    refetch,
    addParticipant,
    removeParticipant,
    isAdding: addParticipant.isPending,
    isRemoving: removeParticipant.isPending,
  };
}


