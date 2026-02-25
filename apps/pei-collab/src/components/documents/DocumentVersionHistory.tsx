import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import type { DocumentVersion } from '@/hooks/useDocumentVersions';

type DocumentVersionHistoryProps = {
  studentId: string;
  versions: DocumentVersion[];
  onCreateVersion: () => void;
  canCreateVersion: boolean;
  creating: boolean;
};

export function DocumentVersionHistory({
  studentId,
  versions,
  onCreateVersion,
  canCreateVersion,
  creating,
}: DocumentVersionHistoryProps) {
  if (!versions.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma versao encontrada.</p>;
  }

  const current = versions.find((v) => v.is_versao_atual) ?? versions[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Historico de versoes</h2>
        {canCreateVersion ? (
          <Button variant="outline" onClick={onCreateVersion} disabled={creating}>
            {creating ? 'Criando...' : 'Criar nova versao'}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Versao atual</span>
            <Badge variant="secondary">ATUAL</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Versao {current.versao}</Badge>
            <DocumentStatusBadge status={current.status} />
          </div>
          <Button asChild variant="outline">
            <Link href={`/dashboard/students/${studentId}/documents/${current.id}`}>Abrir</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {versions
          .filter((v) => v.id !== current.id)
          .map((version) => (
            <Card key={version.id}>
              <CardHeader>
                <CardTitle className="text-base">Versao {version.versao}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <DocumentStatusBadge status={version.status} />
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/students/${studentId}/documents/${version.id}`}>Ver</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
