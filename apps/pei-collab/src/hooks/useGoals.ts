import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type Goal = {
  id: string;
  student_id: string;
  document_id: string | null;
  titulo: string;
  descricao: string | null;
  status: 'ativa' | 'concluida' | 'arquivada';
  data_inicio?: string | null;
  data_meta?: string | null;
  progresso?: number;
  created_at: string | null;
  updated_at: string | null;
  student_nome?: string | null;
  is_atrasada?: boolean;
};

export function useGoals(studentId: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_goals', {
      p_student_id: studentId,
      p_filter: 'todas',
    });

    if (rpcError) {
      setError('Não foi possível carregar as metas.');
      setGoals([]);
    } else {
      setGoals((data ?? []) as Goal[]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(
    async (payload: { titulo: string; descricao?: string | null }) => {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_goal', {
        p_student_id: studentId,
        p_titulo: payload.titulo,
        p_descricao: payload.descricao ?? null,
        p_document_id: null,
      });

      if (rpcError) {
        throw new Error('Não foi possível criar a meta.');
      }

      await fetchGoals();
      return data as string;
    },
    [fetchGoals, studentId]
  );

  const updateGoal = useCallback(
    async (payload: {
      id: string;
      titulo: string;
      descricao?: string | null;
      status?: Goal['status'] | null;
    }) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('update_goal', {
        p_goal_id: payload.id,
        p_titulo: payload.titulo,
        p_descricao: payload.descricao ?? null,
        p_status: payload.status ?? null,
      });

      if (rpcError) {
        throw new Error('Não foi possível atualizar a meta.');
      }

      await fetchGoals();
    },
    [fetchGoals]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('delete_goal', {
        p_goal_id: goalId,
      });

      if (rpcError) {
        throw new Error('Não foi possível remover a meta.');
      }

      await fetchGoals();
    },
    [fetchGoals]
  );

  return {
    goals,
    loading,
    error,
    refresh: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
