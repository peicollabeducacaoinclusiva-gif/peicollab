import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type ManagedUser = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  school_nome: string | null;
};

export function useUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_users');

    if (rpcError) {
      setError('Não foi possível carregar os usuários.');
      setUsers([]);
    } else {
      setUsers((data ?? []) as ManagedUser[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserStatus = useCallback(
    async (userId: string, active: boolean) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('set_user_active', {
        p_user_id: userId,
        p_active: active,
      });

      if (rpcError) {
        throw new Error('Não foi possível atualizar o usuário.');
      }

      await fetchUsers();
    },
    [fetchUsers]
  );

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    updateUserStatus,
  };
}
