import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type TemplateSection = {
  id: string;
  nome_secao: string;
  ordem: number;
  descricao?: string | null;
  fields: TemplateField[];
};

export type TemplateField = {
  id: string;
  label: string;
  tipo_campo: string;
  required: boolean;
  options_json?: string | null;
  ordem: number;
};

export type TemplateDetail = {
  id: string;
  nome_template: string;
  tipo: 'estudo_caso' | 'paee' | 'pei';
  versao: number;
  ativo: boolean;
  sections: TemplateSection[];
};

export function useTemplateEditor(templateId: string) {
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_template_detail', {
      p_template_id: templateId,
    });

    if (rpcError) {
      setError('Não foi possível carregar o template.');
      setTemplate(null);
    } else {
      setTemplate(data as TemplateDetail);
    }

    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const saveTemplate = useCallback(
    async (payload: TemplateDetail) => {
      setSaving(true);
      setError(null);

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('upsert_template', {
        p_template: payload,
      });

      if (rpcError) {
        setError('Não foi possível salvar o template.');
      } else {
        await fetchTemplate();
      }

      setSaving(false);
    },
    [fetchTemplate]
  );

  return {
    template,
    loading,
    saving,
    error,
    saveTemplate,
  };
}
