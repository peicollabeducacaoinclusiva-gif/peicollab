import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type FamilyLink = {
  id: string;
  user_id: string;
  user_name: string;
  student_id: string;
  student_nome: string;
  school_nome: string | null;
};

export function useFamilyLinks() {
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_family_links');

    if (rpcError) {
      setError('Não foi possível carregar os vínculos.');
      setLinks([]);
    } else {
      setLinks((data ?? []) as FamilyLink[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const createLink = useCallback(
    async (userId: string, studentId: string) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('create_family_link', {
        p_user_id: userId,
        p_student_id: studentId,
      });

      if (rpcError) {
        throw new Error('Não foi possível criar o vínculo.');
      }

      await fetchLinks();
    },
    [fetchLinks]
  );

  const deleteLink = useCallback(
    async (linkId: string) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('delete_family_link', {
        p_link_id: linkId,
      });

      if (rpcError) {
        throw new Error('Não foi possível remover o vínculo.');
      }

      await fetchLinks();
    },
    [fetchLinks]
  );

  return {
    links,
    loading,
    error,
    refresh: fetchLinks,
    createLink,
    deleteLink,
  };
}
