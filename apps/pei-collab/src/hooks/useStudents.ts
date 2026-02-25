import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type Student = {
  id: string;
  nome: string;
  serie: string | null;
  turno: string | null;
  categoria_necessidade: string | null;
  school_nome?: string | null;
  documents_count?: number | null;
  goals_count?: number | null;
};

type Filters = {
  search: string;
  categoria: string;
  serie: string;
};

export function useStudents(filters: Filters) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_students', {
      p_search: filters.search || null,
      p_categoria: filters.categoria || null,
      p_serie: filters.serie || null,
    });

    if (rpcError) {
      setError('Não foi possível carregar os estudantes.');
      setStudents([]);
    } else {
      setStudents((data ?? []) as Student[]);
    }

    setLoading(false);
  }, [filters.categoria, filters.search, filters.serie]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  type CreateStudentPayload = {
    nome: string;
    school_id: string;
    serie?: string | null;
    turno?: string | null;
    categoria_necessidade?: string | null;
  };

  const createStudent = useCallback(
    async (payload: CreateStudentPayload) => {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_student', {
        p_nome: payload.nome,
        p_data_nascimento: null,
        p_serie: payload.serie ?? null,
        p_turno: payload.turno ?? null,
        p_categoria_necessidade: payload.categoria_necessidade ?? null,
        p_school_id: payload.school_id,
      });

      if (rpcError) {
        throw new Error('Não foi possível criar o estudante.');
      }

      await fetchStudents();
      return data;
    },
    [fetchStudents]
  );

  return {
    students,
    loading,
    error,
    refresh: fetchStudents,
    createStudent,
  };
}
