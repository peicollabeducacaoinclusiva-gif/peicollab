'use client';

import { useParams, useRouter } from 'next/navigation';

import { DocumentVersionHistory } from '@/components/documents/DocumentVersionHistory';
import { useDocumentVersions } from '@/hooks/useDocumentVersions';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { usePermissions } from '@/hooks/usePermissions';

export default function DocumentVersionsPage() {
  const params = useParams<{ id: string; docId: string }>();
  const router = useRouter();
  const studentId = params?.id ?? '';
  const documentId = params?.docId ?? '';

  const permissions = usePermissions();
  const { versions, loading, error } = useDocumentVersions(documentId);
  const { createVersion, saving } = useDocumentEditor({
    studentId,
    documentId,
  });

  const handleCreate = async () => {
    const newId = await createVersion();
    if (newId) {
      router.push(`/dashboard/students/${studentId}/documents/${newId}`);
    }
  };

  if (loading) {
    return <p>Carregando historico...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <DocumentVersionHistory
      studentId={studentId}
      versions={versions}
      onCreateVersion={handleCreate}
      canCreateVersion={permissions.canCreateVersion()}
      creating={saving}
    />
  );
}
