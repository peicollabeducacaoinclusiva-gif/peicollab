import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type FamilyUser = {
  id: string;
  name: string;
};

export function useFamilyUsers() {
  const [users, setUsers] = useState<FamilyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_family_users');

    if (rpcError) {
      setError('Não foi possível carregar as famílias.');
      setUsers([]);
    } else {
      setUsers((data ?? []) as FamilyUser[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
  };
}
