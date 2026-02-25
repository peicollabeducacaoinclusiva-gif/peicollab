'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PermissionGate } from '@/components/auth/PermissionGate';
import type { StudentAuthorization } from '@/hooks/useStudentAuthorizations';

type StudentAuthorizationsProps = {
  studentId: string;
  authorizations: StudentAuthorization[];
  loading: boolean;
  error: string | null;
  onUpsertAuthorization: (tipo: string, autorizado: boolean) => Promise<void>;
};

const TIPO_LABELS: Record<string, string> = {
  paee_digital: 'PAEE Digital',
  imagens: 'Uso de imagens',
};

const TIPOS_ORDEM = ['paee_digital', 'imagens'];

export function StudentAuthorizations({
  studentId,
  authorizations,
  loading,
  error,
  onUpsertAuthorization,
}: StudentAuthorizationsProps) {
  const getAutorizado = (tipo: string) => {
    const a = authorizations.find((x) => x.tipo === tipo);
    return a?.autorizado ?? false;
  };

  const handleToggle = async (tipo: string, checked: boolean) => {
    await onUpsertAuthorization(tipo, checked);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autorizações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autorizações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autorizações</CardTitle>
        <p className="text-sm text-muted-foreground">
          Autorizações do responsável para uso de dados e imagens.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {TIPOS_ORDEM.map((tipo) => (
            <div key={tipo} className="flex items-center justify-between gap-4">
              <Label className="flex-1">{TIPO_LABELS[tipo] ?? tipo}</Label>
              <div className="flex items-center gap-2">
                <Badge variant={getAutorizado(tipo) ? 'default' : 'outline'}>
                  {getAutorizado(tipo) ? 'Autorizado' : 'Não autorizado'}
                </Badge>
                <PermissionGate permission="canCreateDocument">
                  <Button
                    size="sm"
                    variant={getAutorizado(tipo) ? 'outline' : 'default'}
                    onClick={() => handleToggle(tipo, !getAutorizado(tipo))}
                  >
                    {getAutorizado(tipo) ? 'Revogar' : 'Autorizar'}
                  </Button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
