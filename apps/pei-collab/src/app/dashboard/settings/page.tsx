'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserContext } from '@/hooks/useUserContext';
import { createClient } from '@/lib/supabase/client';
import { roleLabels } from '@/lib/rbac';

export default function SettingsPage() {
  const permissions = usePermissions();
  const { networkName, schoolName } = useUserContext();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  const canAccessUsers = permissions.canManageUsers() || permissions.canManageFamilyLinks();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie preferências e opções do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sessão e perfil</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {permissions.loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              {email && (
                <p className="text-sm">
                  <span className="text-muted-foreground">E-mail:</span> {email}
                </p>
              )}
              {permissions.user && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Papel:</span>{' '}
                  <Badge variant="outline">
                    {roleLabels[permissions.user.role]}
                  </Badge>
                </p>
              )}
              <p className="text-sm">
                <span className="text-muted-foreground">Rede:</span> {networkName ?? '-'}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Escola:</span> {schoolName ?? '-'}
              </p>
              <Badge variant="outline" className="mt-2">
                Sessão ativa
              </Badge>
            </>
          )}
        </CardContent>
      </Card>

      {canAccessUsers && (
        <Link href="/dashboard/settings/users">
          <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Usuários e vínculos</h2>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie usuários do sistema e vínculos entre família e alunos.
              </p>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
