'use client';

import { useParams } from 'next/navigation';

import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { useTemplateEditor } from '@/hooks/useTemplateEditor';
import { usePermissions } from '@/hooks/usePermissions';

export default function TemplateEditPage() {
  const params = useParams<{ id: string }>();
  const templateId = params?.id ?? '';
  const { template, loading, error, saving, saveTemplate } = useTemplateEditor(templateId);
  const permissions = usePermissions();

  if (permissions.loading || loading) {
    return <p>Carregando template...</p>;
  }

  if (!permissions.canEditTemplate()) {
    return <p className="text-sm text-muted-foreground">Sem permissão para editar templates.</p>;
  }

  if (error || !template) {
    return <p className="text-sm text-destructive">Não foi possível carregar o template.</p>;
  }

  return <TemplateEditor template={template} saving={saving} onSave={saveTemplate} />;
}
