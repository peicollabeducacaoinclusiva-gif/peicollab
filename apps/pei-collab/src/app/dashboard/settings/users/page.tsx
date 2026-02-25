'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { FamilyLinkPanel } from '@/components/settings/FamilyLinkPanel';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { UserManagementTable } from '@/components/settings/UserManagementTable';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUserManagement } from '@/hooks/useUserManagement';

const NoPermissionFallback = () => (
  <p className="text-sm text-muted-foreground">
    Você não tem permissão para acessar esta área.{' '}
    <Link href="/dashboard/settings">
      <Button variant="link" className="h-auto p-0">
        Voltar para Configurações
      </Button>
    </Link>
  </p>
);

export default function UsersSettingsPage() {
  const { users, loading, error, updateUserStatus } = useUserManagement();

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb
        items={[
          { label: 'Configurações', href: '/dashboard/settings' },
          { label: 'Usuários e vínculos' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold">Usuários e vínculos</h1>
        <p className="text-sm text-muted-foreground">Gerencie vínculos entre família e alunos.</p>
      </div>

      <PermissionGate permission="canManageUsers" fallback={<NoPermissionFallback />}>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Usuários</h2>
          {loading ? <p className="text-sm text-muted-foreground">Carregando usuários...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && !error ? (
            <UserManagementTable users={users} onToggleActive={updateUserStatus} />
          ) : null}
        </div>
      </PermissionGate>

      <Separator className="my-6" />

      <PermissionGate permission="canManageFamilyLinks" fallback={<NoPermissionFallback />}>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Vínculos família-aluno</h2>
          <FamilyLinkPanel />
        </div>
      </PermissionGate>
    </div>
  );
}
