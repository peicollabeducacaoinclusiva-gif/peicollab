import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type DashboardActivity = {
  title: string;
  created_at: string;
  status: string;
};

export function useDashboardActivity(limit = 3) {
  const [items, setItems] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function fetchActivity() {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_recent_activity', {
        p_limit: limit,
      });

      if (!active) return;

      if (error || !data) {
        setItems([]);
      } else {
        setItems((data ?? []) as DashboardActivity[]);
      }
      setLoading(false);
    }

    fetchActivity();

    return () => {
      active = false;
    };
  }, [limit]);

  return { items, loading };
}
