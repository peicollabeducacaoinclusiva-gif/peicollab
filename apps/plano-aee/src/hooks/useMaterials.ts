// ============================================================================
// HOOK: useMaterials
// ============================================================================
// Gerenciamento de materiais de acessibilidade
// Data: 2025-02-20
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import type {
  MaterialProductionSession,
  CreateMaterialProductionSessionInput,
  UpdateMaterialProductionSessionInput,
  MaterialUsageLog,
  CreateMaterialUsageLogInput,
  UpdateMaterialUsageLogInput,
  MaterialProductionSessionFilters,
  MaterialUsageLogFilters,
} from '../types/materials.types';

// ============================================================================
// HOOK: Sessões de Produção de Materiais
// ============================================================================

export function useMaterialProductionSessions(
  planId: string,
  filters?: MaterialProductionSessionFilters
) {
  const queryClient = useQueryClient();

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['material-production-sessions', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_material_production_sessions')
        .select(`
          *,
          student:students(full_name),
          creator:profiles!aee_material_production_sessions_created_by_fkey(full_name)
        `)
        .eq('plan_id', planId)
        .order('session_date', { ascending: false });

      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters?.material_type) {
        query = query.eq('material_type', filters.material_type);
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

      return (data || []).map((session: any) => ({
        ...session,
        student_name: session.student?.full_name,
        creator_name: session.creator?.full_name,
      })) as MaterialProductionSession[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });

  const createSession = useMutation({
    mutationFn: async (input: CreateMaterialProductionSessionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_material_production_sessions')
        .insert({
          ...input,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MaterialProductionSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['material-production-sessions', planId],
      });
      toast.success('Sessão de produção criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar sessão de produção', {
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
      input: UpdateMaterialProductionSessionInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_material_production_sessions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MaterialProductionSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['material-production-sessions', planId],
      });
      toast.success('Sessão atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar sessão', {
        description: error.message,
      });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aee_material_production_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['material-production-sessions', planId],
      });
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
// HOOK: Logs de Uso de Materiais
// ============================================================================

export function useMaterialUsageLogs(
  planId: string,
  filters?: MaterialUsageLogFilters
) {
  const queryClient = useQueryClient();

  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['material-usage-logs', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_materials_usage_log')
        .select(`
          *,
          student:students(full_name),
          user:profiles!aee_materials_usage_log_used_by_fkey(full_name)
        `)
        .eq('plan_id', planId)
        .order('used_date', { ascending: false });

      if (filters?.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters?.material_type) {
        query = query.eq('material_type', filters.material_type);
      }
      if (filters?.context) {
        query = query.eq('context', filters.context);
      }
      if (filters?.date_from) {
        query = query.gte('used_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('used_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((log: any) => ({
        ...log,
        student_name: log.student?.full_name,
        user_name: log.user?.full_name,
      })) as MaterialUsageLog[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });

  const createLog = useMutation({
    mutationFn: async (input: CreateMaterialUsageLogInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aee_materials_usage_log')
        .insert({
          ...input,
          used_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MaterialUsageLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['material-usage-logs', planId],
      });
      toast.success('Registro de uso criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar registro de uso', {
        description: error.message,
      });
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateMaterialUsageLogInput;
    }) => {
      const { data, error } = await supabase
        .from('aee_materials_usage_log')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MaterialUsageLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['material-usage-logs', planId],
      });
      toast.success('Registro atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar registro', {
        description: error.message,
      });
    },
  });

  return {
    logs: logs || [],
    isLoading,
    error,
    refetch,
    createLog,
    updateLog,
    isCreating: createLog.isPending,
    isUpdating: updateLog.isPending,
  };
}

