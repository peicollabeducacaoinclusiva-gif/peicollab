'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type DocumentRatingStats = {
  avgRating: number;
  countRatings: number;
  userRating: number | null;
};

export function useDocumentRating(documentId: string | undefined) {
  const [stats, setStats] = useState<DocumentRatingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_document_rating_stats', {
      p_document_id: documentId,
    });
    setLoading(false);
    if (error) return;
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      setStats({
        avgRating: Number(row.avg_rating ?? 0),
        countRatings: Number(row.count_ratings ?? 0),
        userRating: row.user_rating != null ? Number(row.user_rating) : null,
      });
    } else {
      setStats({ avgRating: 0, countRatings: 0, userRating: null });
    }
  }, [documentId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const setRating = useCallback(
    async (rating: number) => {
      if (!documentId || rating < 1 || rating > 5) return;
      const { error } = await supabase.rpc('upsert_document_rating', {
        p_document_id: documentId,
        p_rating: rating,
      });
      if (!error) {
        await fetchStats();
      }
    },
    [documentId, fetchStats]
  );

  return { stats, loading, setRating };
}
