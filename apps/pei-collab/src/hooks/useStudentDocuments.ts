import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type StudentDocument = {
  id: string;
  tipo: string;
  status: string;
  versao: number;
  created_at: string | null;
  aprovado_em: string | null;
  template_id: string;
};

export function useStudentDocuments(studentId: string) {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_student_documents', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar os documentos.');
      setDocuments([]);
    } else {
      setDocuments((data ?? []) as StudentDocument[]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    fetchDocuments();
  }, [fetchDocuments, studentId]);

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
  };
}
