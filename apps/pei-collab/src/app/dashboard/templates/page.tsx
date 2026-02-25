'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateList } from '@/components/templates/TemplateList';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useTemplates } from '@/hooks/useTemplates';
import { Library } from 'lucide-react';

export default function TemplatesPage() {
  const { templates, loading, error } = useTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">Gerencie templates de documentos.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <PermissionGate permission="canEditTemplate" fallback={<p>Sem permissão.</p>}>
        {!loading && !error ? (
          templates.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Nenhum template cadastrado"
              description="Os templates definem a estrutura dos documentos PEI, PAEE e Estudo de Caso. Entre em contato com o administrador para cadastrar templates."
            />
          ) : (
            <TemplateList templates={templates} />
          )
        ) : null}
      </PermissionGate>
    </div>
  );
}
