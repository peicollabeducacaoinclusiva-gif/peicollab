'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Relatórios e análises em desenvolvimento.</p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <BarChart3 className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-center font-medium text-muted-foreground">
            Relatórios em desenvolvimento
          </p>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            Em breve: exportação PDF, métricas por escola e análise de metas.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/documents">Acessar documentos</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
