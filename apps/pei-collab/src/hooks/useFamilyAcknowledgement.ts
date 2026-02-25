import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type FamilyAcknowledgementInfo = {
  user_id: string;
  user_name: string;
  aceite_boolean: boolean;
  data_aceite: string | null;
};

export function useFamilyAcknowledgement(documentId: string | undefined) {
  const [acknowledgements, setAcknowledgements] = useState<FamilyAcknowledgementInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAcknowledgement = useCallback(async () => {
    if (!documentId) {
      setAcknowledgements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_family_acknowledgement', {
      p_document_id: documentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar a ciência da família.');
      setAcknowledgements([]);
    } else {
      setAcknowledgements((data ?? []) as FamilyAcknowledgementInfo[]);
    }

    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchAcknowledgement();
  }, [fetchAcknowledgement]);

  const confirmAcknowledgement = useCallback(async () => {
    if (!documentId) return;

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('upsert_family_acknowledgement', {
      p_document_id: documentId,
    });

    if (rpcError) {
      setError('Não foi possível confirmar a ciência.');
    } else {
      await fetchAcknowledgement();
    }
  }, [documentId, fetchAcknowledgement]);

  return {
    acknowledgements,
    loading,
    error,
    confirmAcknowledgement,
    refresh: fetchAcknowledgement,
  };
}
