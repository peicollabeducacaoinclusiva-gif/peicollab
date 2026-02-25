'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DocumentEditor } from '@/components/documents/DocumentEditor';
import { usePermissions } from '@/hooks/usePermissions';

export default function NewDocumentPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const studentId = params?.id ?? '';
  const templateId = searchParams.get('templateId') ?? '';
  const permissions = usePermissions();

  useEffect(() => {
    if (!permissions.loading && !templateId && studentId) {
      router.replace(`/dashboard/documents/new?studentId=${studentId}`);
    }
  }, [permissions.loading, templateId, studentId, router]);

  if (permissions.loading) {
    return <p>Carregando...</p>;
  }

  if (!permissions.canCreateDocument()) {
    return <p className="text-sm text-muted-foreground">Sem permissão para criar documentos.</p>;
  }

  if (!templateId) {
    return (
      <p className="text-sm text-muted-foreground">Redirecionando para selecionar o template...</p>
    );
  }

  return <DocumentEditor studentId={studentId} templateId={templateId} />;
}
