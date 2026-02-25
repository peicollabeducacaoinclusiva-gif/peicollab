import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type TimelineEventType =
  | 'document_created'
  | 'document_approved'
  | 'document_rejected'
  | 'document_version_created'
  | 'family_confirmed'
  | 'family_rejected'
  | 'goal_created'
  | 'comment_created'
  | 'meeting_scheduled';

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  document_id?: string;
  goal_id?: string;
  tipo?: string;
  user_name?: string;
  titulo?: string;
  motivo?: string;
  nova_versao?: number;
  content_preview?: string;
  data_reuniao?: string;
  tema?: string;
  status?: string;
};

export function useStudentTimeline(studentId: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!studentId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_student_timeline', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar a linha do tempo.');
      setEvents([]);
    } else {
      const raw = (data ?? []) as TimelineEvent[];
      setEvents(Array.isArray(raw) ? raw : []);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    events,
    loading,
    error,
    refresh: fetchTimeline,
  };
}
