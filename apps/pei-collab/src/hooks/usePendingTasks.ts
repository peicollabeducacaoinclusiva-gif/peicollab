'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type PendingTask = {
  id: string;
  tipo: string;
  titulo: string;
  student_id: string;
  document_id: string;
  student_name: string;
  task_type: string;
  created_at: string;
};

export function usePendingTasks(limit = 5) {
  const [items, setItems] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function fetchTasks() {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_pending_tasks', {
        p_limit: limit,
      });

      if (!active) return;

      if (error || !data) {
        setItems([]);
      } else {
        setItems((data ?? []) as PendingTask[]);
      }
      setLoading(false);
    }

    fetchTasks();
  }, [limit]);

  return { items, loading };
}
