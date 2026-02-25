'use client';

import { useParams } from 'next/navigation';

import { DocumentEditor } from '@/components/documents/DocumentEditor';

export default function DocumentPage() {
  const params = useParams<{ id: string; docId: string }>();
  const studentId = params?.id ?? '';
  const documentId = params?.docId ?? '';

  if (!documentId) {
    return <p className="text-sm text-muted-foreground">Documento não encontrado.</p>;
  }

  return <DocumentEditor studentId={studentId} documentId={documentId} />;
}
