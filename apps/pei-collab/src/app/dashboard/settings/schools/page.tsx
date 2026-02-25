'use client';

import Link from 'next/link';
import { Building } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { SchoolForm } from '@/components/settings/SchoolForm';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchools } from '@/hooks/useSchools';
import { createClient } from '@/lib/supabase/client';

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

export default function SchoolsSettingsPage() {
  const { schools, loading, error, refetch } = useSchools();

  const handleCreate = async (values: { name: string; inep_code?: string }) => {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('create_school', {
      p_name: values.name,
      p_inep_code: values.inep_code || null,
    });
    if (rpcError) throw rpcError;
    await refetch();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb
        items={[
          { label: 'Configurações', href: '/dashboard/settings' },
          { label: 'Escolas' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold">Escolas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as escolas da sua rede. Apenas admin_rede pode criar escolas.
        </p>
      </div>

      <PermissionGate permission="canCreateSchool" fallback={<NoPermissionFallback />}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Escolas da rede</CardTitle>
            <SchoolForm onCreate={handleCreate} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando escolas...</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : schools.length === 0 ? (
              <EmptyState
                icon={Building}
                title="Nenhuma escola cadastrada"
                description="Adicione a primeira escola da rede usando o formulário acima."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 transition-shadow hover:shadow-md"
                  >
                    <span className="font-medium">{school.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}
