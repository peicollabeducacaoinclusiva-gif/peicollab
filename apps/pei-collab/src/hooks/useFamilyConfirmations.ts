import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type FamilyConfirmation = {
  document_id: string;
  student_id: string;
  tipo_documento: string;
  student_nome: string;
  enviado_em: string;
  status: 'pendente' | 'confirmado' | 'rejeitado';
};

export type FamilyConfirmationsSummary = {
  pendentes: number;
  confirmadas: number;
  rejeitadas: number;
};

export function useFamilyConfirmations() {
  const [confirmations, setConfirmations] = useState<FamilyConfirmation[]>([]);
  const [summary, setSummary] = useState<FamilyConfirmationsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_family_confirmations_summary');
    if (!rpcError && data) {
      setSummary({
        pendentes: Number(data.pendentes ?? 0),
        confirmadas: Number(data.confirmadas ?? 0),
        rejeitadas: Number(data.rejeitadas ?? 0),
      });
    } else {
      setSummary({ pendentes: 0, confirmadas: 0, rejeitadas: 0 });
    }
  }, []);

  const fetchConfirmations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_family_confirmations');

    if (rpcError) {
      setError('Não foi possível carregar as confirmações.');
      setConfirmations([]);
    } else {
      setConfirmations((data ?? []) as FamilyConfirmation[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchConfirmations();
  }, [fetchConfirmations]);

  return {
    confirmations,
    summary,
    loading,
    error,
    refresh: async () => {
      await fetchSummary();
      await fetchConfirmations();
    },
  };
}
