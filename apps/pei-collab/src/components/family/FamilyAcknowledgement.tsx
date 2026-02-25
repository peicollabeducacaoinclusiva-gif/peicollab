'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import type { FamilyAcknowledgementInfo } from '@/hooks/useFamilyAcknowledgement';

type FamilyAcknowledgementProps = {
  documentId: string | undefined;
  acknowledgements: FamilyAcknowledgementInfo[];
  loading: boolean;
  error: string | null;
  onConfirmAcknowledgement: () => Promise<void>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FamilyAcknowledgement({
  documentId,
  acknowledgements,
  loading,
  error,
  onConfirmAcknowledgement,
}: FamilyAcknowledgementProps) {
  const [saving, setSaving] = useState(false);
  const permissions = usePermissions();
  const currentUserAck = acknowledgements.find(
    (a) => permissions.user && a.user_id === permissions.user.id
  );
  const hasConfirmed = currentUserAck?.aceite_boolean ?? false;

  if (!documentId) return null;

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Carregando ciência da família...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Ciência da família</h4>
        {error ? <p className="text-sm text-destructive mb-3">{error}</p> : null}
        {acknowledgements.filter((a) => a.aceite_boolean).length > 0 ? (
          <ul className="space-y-2 mb-4">
            {acknowledgements
              .filter((a) => a.aceite_boolean && a.data_aceite)
              .map((a) => (
                <li key={a.user_id} className="text-sm">
                  Ciência confirmada em {formatDate(a.data_aceite!)} por {a.user_name}
                </li>
              ))}
          </ul>
        ) : null}
        <PermissionGate permission="canFamilyAcknowledge">
          {hasConfirmed ? (
            <p className="text-sm text-muted-foreground">
              Sua ciência foi confirmada em{' '}
              {currentUserAck?.data_aceite ? formatDate(currentUserAck.data_aceite) : '-'}.
            </p>
          ) : (
            <Button
              size="sm"
              onClick={async () => {
                setSaving(true);
                await onConfirmAcknowledgement();
                setSaving(false);
              }}
              disabled={saving}
            >
              {saving ? 'Confirmando...' : 'Confirmar ciência'}
            </Button>
          )}
        </PermissionGate>
        {!permissions.canFamilyAcknowledge() &&
        acknowledgements.filter((a) => a.aceite_boolean).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aguardando ciência da família.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
