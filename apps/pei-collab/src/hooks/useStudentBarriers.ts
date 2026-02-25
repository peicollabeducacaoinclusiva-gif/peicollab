import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type StudentBarrier = {
  id: string;
  tipo: string;
  descricao: string;
  criado_por_nome: string | null;
  created_at: string;
};

export function useStudentBarriers(studentId: string | null) {
  const [barriers, setBarriers] = useState<StudentBarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarriers = useCallback(async () => {
    if (!studentId) {
      setBarriers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_student_barriers', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar as barreiras.');
      setBarriers([]);
    } else {
      setBarriers((data ?? []) as StudentBarrier[]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchBarriers();
  }, [fetchBarriers]);

  const createBarrier = useCallback(
    async (tipo: string, descricao: string) => {
      if (!studentId) return null;

      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_student_barrier', {
        p_student_id: studentId,
        p_tipo: tipo,
        p_descricao: descricao,
      });

      if (rpcError) {
        setError('Não foi possível cadastrar a barreira.');
        return null;
      }
      await fetchBarriers();
      return data as string;
    },
    [studentId, fetchBarriers]
  );

  const deleteBarrier = useCallback(
    async (barrierId: string) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('delete_student_barrier', {
        p_barrier_id: barrierId,
      });
      if (rpcError) {
        setError('Não foi possível remover a barreira.');
        return;
      }
      await fetchBarriers();
    },
    [fetchBarriers]
  );

  return { barriers, loading, error, createBarrier, deleteBarrier, refresh: fetchBarriers };
}
