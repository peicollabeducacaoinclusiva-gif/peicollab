import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type DashboardMetrics = {
  students: number;
  documents: number;
  goals: number;
  confirmations: number;
};

const defaultMetrics: DashboardMetrics = {
  students: 0,
  documents: 0,
  goals: 0,
  confirmations: 0,
};

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function fetchMetrics() {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_metrics');

      if (!active) return;

      if (error || !data) {
        setMetrics(defaultMetrics);
      } else {
        setMetrics({
          students: data.students ?? 0,
          documents: data.documents ?? 0,
          goals: data.goals ?? 0,
          confirmations: data.confirmations ?? 0,
        });
      }
      setLoading(false);
    }

    fetchMetrics();

    return () => {
      active = false;
    };
  }, []);

  return { metrics, loading };
}
