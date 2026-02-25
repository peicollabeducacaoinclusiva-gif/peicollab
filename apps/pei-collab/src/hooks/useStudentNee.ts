import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type StudentNee = {
  id: string;
  area: string;
  descricao: string;
  criado_por_nome: string | null;
  created_at: string;
};

export function useStudentNee(studentId: string | null) {
  const [nee, setNee] = useState<StudentNee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNee = useCallback(async () => {
    if (!studentId) {
      setNee([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_student_nee', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar as NEE.');
      setNee([]);
    } else {
      setNee((data ?? []) as StudentNee[]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchNee();
  }, [fetchNee]);

  const createNee = useCallback(
    async (area: string, descricao: string) => {
      if (!studentId) return null;

      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_student_nee', {
        p_student_id: studentId,
        p_area: area,
        p_descricao: descricao,
      });

      if (rpcError) {
        setError('Não foi possível cadastrar a NEE.');
        return null;
      }
      await fetchNee();
      return data as string;
    },
    [studentId, fetchNee]
  );

  const deleteNee = useCallback(
    async (neeId: string) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('delete_student_nee', {
        p_nee_id: neeId,
      });
      if (rpcError) {
        setError('Não foi possível remover a NEE.');
        return;
      }
      await fetchNee();
    },
    [fetchNee]
  );

  return { nee, loading, error, createNee, deleteNee, refresh: fetchNee };
}
