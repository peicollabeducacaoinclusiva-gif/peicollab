import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type StudentProfile = {
  id: string;
  nome: string;
  serie: string | null;
  turno: string | null;
  categoria_necessidade: string | null;
  data_nascimento: string | null;
  school_nome: string | null;
};

export function useStudentProfile(studentId: string) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_student_profile', {
      p_student_id: studentId,
    });

    if (rpcError) {
      setError('Não foi possível carregar o perfil do aluno.');
      setProfile(null);
    } else {
      setProfile((data ?? null) as StudentProfile | null);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    fetchProfile();
  }, [fetchProfile, studentId]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
  };
}
