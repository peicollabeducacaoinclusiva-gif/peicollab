'use client';

import Link from 'next/link';

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePendingTasks } from '@/hooks/usePendingTasks';

export default function DocumentsHubPage() {
  const { items: pendingTasks, loading: pendingLoading } = usePendingTasks(10);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crie novos documentos ou acesse tarefas pendentes de validação.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Ação principal</h2>
        <PermissionGate permission="canCreateDocument">
          <Button asChild className="min-w-[200px]">
            <Link href="/dashboard/documents/new">
              <FileText className="mr-2 h-4 w-4" />
              Novo documento
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Tarefas pendentes</h2>
        {pendingLoading ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Carregando...
            </CardContent>
          </Card>
        ) : pendingTasks.length ? (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium">{task.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.task_type === 'validacao'
                        ? 'Aguardando sua validação'
                        : 'Aguardando validação'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/dashboard/students/${task.student_id}/documents/${task.document_id}`}
                    >
                      Abrir
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Nenhuma tarefa pendente.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="rounded-md border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Para ver todos os documentos, acesse o perfil do aluno em{' '}
        <Link href="/dashboard/students" className="font-medium text-foreground hover:underline">
          Alunos
        </Link>
        .
      </div>
    </div>
  );
}
