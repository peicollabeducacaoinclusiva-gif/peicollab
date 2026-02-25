import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type GoalOverview = {
  id: string;
  student_id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  data_inicio: string | null;
  data_meta: string | null;
  progresso: number;
  student_nome: string | null;
  is_atrasada: boolean;
};

export type GoalsSummary = {
  total: number;
  concluidas: number;
  em_progresso: number;
  atrasadas: number;
};

export type GoalsFilter = 'todas' | 'em_progresso' | 'concluidas' | 'atrasadas';

export function useGoalsOverview(filter: GoalsFilter = 'todas') {
  const [goals, setGoals] = useState<GoalOverview[]>([]);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_goals_summary');
    if (!rpcError && data) {
      setSummary({
        total: Number(data.total ?? 0),
        concluidas: Number(data.concluidas ?? 0),
        em_progresso: Number(data.em_progresso ?? 0),
        atrasadas: Number(data.atrasadas ?? 0),
      });
    } else {
      setSummary({ total: 0, concluidas: 0, em_progresso: 0, atrasadas: 0 });
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_goals', {
      p_student_id: null,
      p_filter: filter,
    });

    if (rpcError) {
      setError('Não foi possível carregar as metas.');
      setGoals([]);
    } else {
      setGoals((data ?? []) as GoalOverview[]);
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    summary,
    loading,
    error,
    refresh: async () => {
      await fetchSummary();
      await fetchGoals();
    },
  };
}
