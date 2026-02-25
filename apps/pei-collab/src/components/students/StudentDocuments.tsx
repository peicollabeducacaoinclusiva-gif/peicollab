import Link from 'next/link';

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import type { StudentDocument } from '@/hooks/useStudentDocuments';

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

type StudentDocumentsProps = {
  studentId: string;
  documents: StudentDocument[];
};

export function StudentDocuments({ studentId, documents }: StudentDocumentsProps) {
  const sortedDocs = [...documents].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  if (!documents.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="mb-1 font-medium text-muted-foreground">
            Nenhum documento cadastrado
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            Crie o primeiro documento para este aluno.
          </p>
          <Button asChild>
            <Link href={`/dashboard/documents/new?studentId=${studentId}`}>
              Novo documento
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sortedDocs.map((doc) => (
        <Card
          key={doc.id}
          className="transition-shadow hover:shadow-md"
        >
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span className="capitalize font-semibold">
                {doc.tipo.replace('_', ' ')}
              </span>
              <DocumentStatusBadge status={doc.status} />
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Versão {doc.versao}</Badge>
              {doc.aprovado_em ? (
                <Badge variant="secondary">Aprovado</Badge>
              ) : null}
              {formatDate(doc.created_at) ? (
                <span>Criado em {formatDate(doc.created_at)}</span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/dashboard/students/${studentId}/documents/${doc.id}`}>
                Abrir
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/students/${studentId}/documents/${doc.id}/versions`}>
                Versões
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
