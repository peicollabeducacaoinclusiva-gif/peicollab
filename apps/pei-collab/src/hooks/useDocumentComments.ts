import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type DocumentComment = {
  id: string;
  section_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

export function useDocumentComments(documentId: string | undefined) {
  const [comments, setComments] = useState<DocumentComment[]>([]);
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
    const { data, error: rpcError } = await supabase.rpc('get_document_comments', {
      p_document_id: documentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar os comentários.');
      setComments([]);
    } else {
      setComments((data ?? []) as DocumentComment[]);
    }

    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (sectionId: string, content: string) => {
      if (!documentId || !content.trim()) return;

      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_document_comment', {
        p_document_id: documentId,
        p_section_id: sectionId,
        p_content: content.trim(),
      });

      if (rpcError) {
        setError('Não foi possível adicionar o comentário.');
      } else {
        await fetchComments();
      }
    },
    [documentId, fetchComments]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('delete_document_comment', {
        p_comment_id: commentId,
      });

      if (rpcError) {
        setError('Não foi possível remover o comentário.');
      } else {
        await fetchComments();
      }
    },
    [fetchComments]
  );

  const commentsBySection = useCallback(
    (sectionId: string) => comments.filter((c) => c.section_id === sectionId),
    [comments]
  );

  return {
    comments,
    commentsBySection,
    loading,
    error,
    addComment,
    removeComment,
    refresh: fetchComments,
  };
}
