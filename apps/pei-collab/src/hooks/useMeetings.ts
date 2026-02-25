import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type Meeting = {
  id: string;
  student_id: string;
  student_nome: string;
  data_reuniao: string;
  tema: string;
  status: string;
  criado_por_nome: string | null;
};

export function useMeetings(studentId: string | null) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    if (!studentId) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_meetings', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar as reuniões.');
      setMeetings([]);
    } else {
      setMeetings((data ?? []) as Meeting[]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const createMeeting = useCallback(
    async (dataReuniao: string, tema: string, convidados?: string[]) => {
      if (!studentId) return null;

      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_meeting', {
        p_student_id: studentId,
        p_data_reuniao: dataReuniao,
        p_tema: tema,
        p_convidados: convidados ?? [],
      });

      if (rpcError) {
        setError('Não foi possível agendar a reunião.');
        return null;
      }
      await fetchMeetings();
      return data as string;
    },
    [studentId, fetchMeetings]
  );

  const updateMeeting = useCallback(
    async (meetingId: string, status?: string, ata?: string) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('update_meeting', {
        p_meeting_id: meetingId,
        p_status: status ?? undefined,
        p_ata: ata ?? undefined,
      });

      if (rpcError) {
        setError('Não foi possível atualizar a reunião.');
      } else {
        await fetchMeetings();
      }
    },
    [fetchMeetings]
  );

  return {
    meetings,
    loading,
    error,
    createMeeting,
    updateMeeting,
    refresh: fetchMeetings,
  };
}
