// ============================================================================
// HOOK: useInteractiveActivities
// ============================================================================
// Gerenciamento de recursos interativos integrados com App Atividades
// Data: 2025-02-20
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import type {
  ActivityLink,
  CreateActivityLinkInput,
  UpdateActivityLinkInput,
  ActivitySession,
  CreateActivitySessionInput,
  UpdateActivitySessionInput,
  ActivityLinkFilters,
  ActivitySessionFilters,
} from '../types/interactiveResources.types';

// ============================================================================
// HOOK: Links de Atividades
// ============================================================================

export function useActivityLinks(planId: string, filters?: ActivityLinkFilters) {
  const queryClient = useQueryClient();

  const {
    data: links,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activity-links', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_activity_links')
        .select(`
          *,
          student:students(full_name),
          linked_by_user:profiles!aee_activity_links_linked_by_fkey(full_name)
        `)
        .eq('plan_id', planId)
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .order('linked_at', { ascending: false });

      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters?.activity_id) {
        query = query.eq('activity_id', filters.activity_id);
      }
      if (filters?.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }
      if (filters?.used_in_context) {
        query = query.eq('used_in_context', filters.used_in_context);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((link: any) => ({
        ...link,
        student_name: link.student?.full_name,
        linked_by_name: link.linked_by_user?.full_name,
      })) as ActivityLink[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });

  const createLink = useMutation({
    mutationFn: async (input: CreateActivityLinkInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Usar RPC se disponível, senão insert direto
      const { data, error } = await supabase.rpc('link_activity_to_aee_plan', {
        p_plan_id: input.plan_id,
        p_activity_id: input.activity_id,
        p_activity_name: input.activity_name,
        p_activity_type: input.activity_type || null,
        p_activity_url: input.activity_url || null,
        p_adaptations_made: input.adaptations_made || [],
        p_target_disabilities: input.target_disabilities || [],
        p_target_skills: input.target_skills || [],
        p_accessibility_adaptations: input.accessibility_adaptations || [],
        p_used_in_context: input.used_in_context || null,
        p_student_id: input.student_id || null,
      }).select().single();

      if (error) {
        // Fallback para insert direto se RPC não existir
        const { data: insertData, error: insertError } = await supabase
          .from('aee_activity_links')
          .insert({
            ...input,
            linked_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return insertData as ActivityLink;
      }

      return data as ActivityLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-links', planId] });
      toast.success('Atividade vinculada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao vincular atividade', {
        description: error.message,
      });
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateActivityLinkInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_activity_links')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ActivityLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-links', planId] });
      toast.success('Vínculo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar vínculo', {
        description: error.message,
      });
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aee_activity_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-links', planId] });
      toast.success('Vínculo removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover vínculo', {
        description: error.message,
      });
    },
  });

  return {
    links: links || [],
    isLoading,
    error,
    refetch,
    createLink,
    updateLink,
    deleteLink,
    isCreating: createLink.isPending,
    isUpdating: updateLink.isPending,
    isDeleting: deleteLink.isPending,
  };
}

// ============================================================================
// HOOK: Sessões de Atividades
// ============================================================================

export function useActivitySessions(
  planId: string,
  filters?: ActivitySessionFilters
) {
  const queryClient = useQueryClient();

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activity-sessions', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_activity_sessions')
        .select(`
          *,
          student:students(full_name),
          user:profiles!aee_activity_sessions_used_by_fkey(full_name),
          activity_link:aee_activity_links(activity_name, activity_type)
        `)
        .eq('plan_id', planId)
        .order('session_date', { ascending: false });

      if (filters?.activity_link_id) {
        query = query.eq('activity_link_id', filters.activity_link_id);
      }
      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters?.date_from) {
        query = query.gte('session_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('session_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((session: any) => ({
        ...session,
        student_name: session.student?.full_name,
        user_name: session.user?.full_name,
        activity_name: session.activity_link?.activity_name,
      })) as ActivitySession[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });

  const createSession = useMutation({
    mutationFn: async (input: CreateActivitySessionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Usar RPC se disponível
      const { data, error } = await supabase.rpc('record_activity_session', {
        p_activity_link_id: input.activity_link_id,
        p_plan_id: input.plan_id,
        p_student_id: input.student_id,
        p_session_date: input.session_date,
        p_duration_minutes: input.duration_minutes || null,
        p_student_responses: input.student_responses || {},
        p_performance_data: input.performance_data || {},
        p_learning_outcomes: input.learning_outcomes || null,
        p_observations: input.observations || null,
        p_student_engagement: input.student_engagement || null,
      }).select().single();

      if (error) {
        // Fallback para insert direto
        const { data: insertData, error: insertError } = await supabase
          .from('aee_activity_sessions')
          .insert({
            ...input,
            used_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return insertData as ActivitySession;
      }

      return data as ActivitySession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-sessions', planId] });
      queryClient.invalidateQueries({ queryKey: ['activity-links', planId] });
      toast.success('Sessão registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar sessão', {
        description: error.message,
      });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateActivitySessionInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_activity_sessions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ActivitySession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-sessions', planId] });
      toast.success('Sessão atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar sessão', {
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
    isCreating: createSession.isPending,
    isUpdating: updateSession.isPending,
  };
}

