import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type StudentAuthorization = {
  tipo: string;
  autorizado: boolean;
};

export function useStudentAuthorizations(studentId: string | null) {
  const [authorizations, setAuthorizations] = useState<StudentAuthorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthorizations = useCallback(async () => {
    if (!studentId) {
      setAuthorizations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_student_authorizations', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar as autorizações.');
      setAuthorizations([]);
    } else {
      setAuthorizations((data ?? []) as StudentAuthorization[]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchAuthorizations();
  }, [fetchAuthorizations]);

  const upsertAuthorization = useCallback(
    async (tipo: string, autorizado: boolean) => {
      if (!studentId) return;

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('upsert_student_authorization', {
        p_student_id: studentId,
        p_tipo: tipo,
        p_autorizado: autorizado,
      });

      if (rpcError) {
        setError('Não foi possível atualizar a autorização.');
      } else {
        await fetchAuthorizations();
      }
    },
    [studentId, fetchAuthorizations]
  );

  return { authorizations, loading, error, upsertAuthorization, refresh: fetchAuthorizations };
}
