import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type Template = {
  id: string;
  nome_template: string;
  tipo: 'estudo_caso' | 'paee' | 'pei';
  versao: number;
  ativo: boolean;
};

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_templates');

    if (rpcError) {
      setError('Não foi possível carregar os templates.');
      setTemplates([]);
    } else {
      setTemplates((data ?? []) as Template[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates,
  };
}
