import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type School = {
  id: string;
  name: string;
};

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_schools');

    if (rpcError) {
      setError('Não foi possível carregar as escolas.');
      setSchools([]);
    } else {
      setSchools((data ?? []) as School[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  return {
    schools,
    loading,
    error,
    refetch: fetchSchools,
  };
}
