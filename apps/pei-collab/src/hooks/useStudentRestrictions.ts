import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type StudentRestriction = {
  id: string;
  tipo: string;
  descricao: string;
  created_at: string;
};

export function useStudentRestrictions(studentId: string | null) {
  const [restrictions, setRestrictions] = useState<StudentRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestrictions = useCallback(async () => {
    if (!studentId) {
      setRestrictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_student_restrictions', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar as restrições.');
      setRestrictions([]);
    } else {
      setRestrictions((data ?? []) as StudentRestriction[]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchRestrictions();
  }, [fetchRestrictions]);

  const createRestriction = useCallback(
    async (tipo: string, descricao: string) => {
      if (!studentId) return null;

      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_student_restriction', {
        p_student_id: studentId,
        p_tipo: tipo,
        p_descricao: descricao,
      });

      if (rpcError) {
        setError('Não foi possível cadastrar a restrição.');
        return null;
      }
      await fetchRestrictions();
      return data as string;
    },
    [studentId, fetchRestrictions]
  );

  return { restrictions, loading, error, createRestriction, refresh: fetchRestrictions };
}
