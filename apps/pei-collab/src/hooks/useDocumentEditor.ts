import { useCallback, useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type DocumentField = {
  id: string;
  label: string;
  tipo_campo: string;
  required: boolean;
  options_json?: string | null;
  ordem: number;
};

export type DocumentSection = {
  id: string;
  nome_secao: string;
  ordem: number;
  fields: DocumentField[];
};

export type DocumentTemplate = {
  id: string;
  tipo: 'estudo_caso' | 'paee' | 'pei';
  sections: DocumentSection[];
};

export type DocumentValueMap = Record<string, string | number | boolean | string[] | null>;

type UseDocumentEditorParams = {
  studentId: string;
  templateId?: string;
  documentId?: string;
};

export function useDocumentEditor({ studentId, templateId, documentId }: UseDocumentEditorParams) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [values, setValues] = useState<DocumentValueMap>({});
  const [status, setStatus] = useState<string>('rascunho');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | undefined>(documentId);

  const orderedSections = useMemo(() => {
    if (!template) return [];
    return [...template.sections].sort((a, b) => a.ordem - b.ordem);
  }, [template]);

  const progress = useMemo(() => {
    if (!template) return { filled: 0, total: 0, percent: 0 };
    const requiredFields = orderedSections.flatMap((s) => s.fields.filter((f) => f.required));
    const total = requiredFields.length;
    if (total === 0) return { filled: 0, total: 0, percent: 100 };
    const filled = requiredFields.filter((f) => {
      const v = values[f.id];
      if (v == null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.trim().length > 0;
      return true;
    }).length;
    return { filled, total, percent: Math.round((filled / total) * 100) };
  }, [template, orderedSections, values]);

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('get_document_template', {
      p_template_id: templateId,
    });

    if (rpcError) {
      setError('Não foi possível carregar o template.');
      setTemplate(null);
      return;
    }

    setTemplate(data as DocumentTemplate);
  }, [templateId]);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    let docId = currentDocumentId;

    if (docId && !templateId) {
      const { data, error: rpcError } = await supabase.rpc('get_document_detail', {
        p_document_id: docId,
      });

      if (rpcError) {
        setError('Não foi possível carregar o documento.');
        setTemplate(null);
      } else if (data?.template) {
        setTemplate(data.template as DocumentTemplate);
        setValues((data.values ?? {}) as DocumentValueMap);
        setStatus(data.status ?? 'rascunho');
      } else {
        setError('Documento ou template não encontrado.');
        setTemplate(null);
      }

      setLoading(false);
      return;
    }

    await fetchTemplate();

    if (!docId) {
      if (!templateId) {
        setError('Template não informado.');
        setLoading(false);
        return;
      }
      const { data, error: createError } = await supabase.rpc('create_document_draft', {
        p_student_id: studentId,
        p_template_id: templateId,
      });

      if (createError) {
        setError('Não foi possível criar o documento.');
        setLoading(false);
        return;
      }

      docId = data?.document_id ?? data;
      setCurrentDocumentId(docId);
    }

    if (docId) {
      const { data, error: rpcError } = await supabase.rpc('get_document_values', {
        p_document_id: docId,
      });

      if (rpcError) {
        setError('Não foi possível carregar o documento.');
      } else if (data) {
        setValues((data.values ?? {}) as DocumentValueMap);
        setStatus(data.status ?? 'rascunho');
      }
    }

    setLoading(false);
  }, [currentDocumentId, fetchTemplate, studentId, templateId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const updateValue = useCallback((fieldId: string, value: DocumentValueMap[string]) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const saveValues = useCallback(async () => {
    if (!currentDocumentId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('upsert_document_values', {
      p_document_id: currentDocumentId,
      p_values: values,
    });

    if (rpcError) {
      setError('Não foi possível salvar o documento.');
    }

    setSaving(false);
  }, [currentDocumentId, values]);

  const submitForValidation = useCallback(async () => {
    if (!currentDocumentId) return;
    setSaving(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('submit_document_for_validation', {
      p_document_id: currentDocumentId,
    });

    if (rpcError) {
      setError('Não foi possível enviar para validação.');
    } else {
      setStatus('em_validacao');
    }

    setSaving(false);
  }, [currentDocumentId]);

  const approveDocument = useCallback(async () => {
    if (!currentDocumentId) return;
    setSaving(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('approve_document', {
      p_document_id: currentDocumentId,
    });

    if (rpcError) {
      setError('Não foi possível aprovar o documento.');
    } else {
      setStatus('aprovado');
    }

    setSaving(false);
  }, [currentDocumentId]);

  const rejectDocument = useCallback(
    async (motivo: string) => {
      if (!currentDocumentId) return;
      setSaving(true);

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('reject_document', {
        p_document_id: currentDocumentId,
        p_motivo: motivo,
      });

      if (rpcError) {
        setError('Não foi possível rejeitar o documento.');
      } else {
        setStatus('rascunho');
      }

      setSaving(false);
    },
    [currentDocumentId]
  );

  const createVersion = useCallback(async () => {
    if (!currentDocumentId) return null;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('create_pei_version', {
      p_document_id: currentDocumentId,
    });

    if (rpcError) {
      setError('Não foi possível criar nova versão.');
      setSaving(false);
      return null;
    }

    setSaving(false);
    return data as string;
  }, [currentDocumentId]);

  return {
    template,
    sections: orderedSections,
    values,
    progress,
    status,
    loading,
    saving,
    error,
    documentId: currentDocumentId,
    updateValue,
    saveValues,
    submitForValidation,
    approveDocument,
    rejectDocument,
    createVersion,
  };
}
