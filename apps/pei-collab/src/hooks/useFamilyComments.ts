import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type FamilyComment = {
  id: string;
  user_id: string;
  user_name: string;
  comentario: string;
  created_at: string;
};

export function useFamilyComments(documentId: string | undefined) {
  const [comments, setComments] = useState<FamilyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!documentId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_family_comments', {
      p_document_id: documentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar os comentários da família.');
      setComments([]);
    } else {
      setComments((data ?? []) as FamilyComment[]);
    }

    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (comentario: string) => {
      if (!documentId || !comentario.trim()) return;

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('create_family_comment', {
        p_document_id: documentId,
        p_comentario: comentario.trim(),
      });

      if (rpcError) {
        setError('Não foi possível adicionar o comentário.');
      } else {
        await fetchComments();
      }
    },
    [documentId, fetchComments]
  );

  return {
    comments,
    loading,
    error,
    addComment,
    refresh: fetchComments,
  };
}
