import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function useUserContext() {
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_my_context');

    if (error || !data) {
      setNetworkName(null);
      setSchoolName(null);
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      setNetworkName((row?.network_name as string) ?? null);
      setSchoolName((row?.school_name as string) ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContext();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchContext();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchContext]);

  return {
    networkName: networkName ?? null,
    schoolName: schoolName ?? null,
    loading,
  };
}
