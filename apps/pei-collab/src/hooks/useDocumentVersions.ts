import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type DocumentVersion = {
  id: string;
  versao: number;
  status: string;
  criado_por: string | null;
  created_at: string | null;
  aprovado_em: string | null;
  is_versao_atual: boolean;
};

export function useDocumentVersions(documentId: string) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_document_versions', {
      p_document_id: documentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar o histórico.');
      setVersions([]);
    } else {
      setVersions((data ?? []) as DocumentVersion[]);
    }

    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;
    fetchVersions();
  }, [fetchVersions, documentId]);

  return {
    versions,
    loading,
    error,
    refresh: fetchVersions,
  };
}
