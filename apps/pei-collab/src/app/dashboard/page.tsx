'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, FileText, Target, Users } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useDashboardActivity } from '@/hooks/useDashboardActivity';
import { usePendingTasks } from '@/hooks/usePendingTasks';
import { PermissionGate } from '@/components/auth/PermissionGate';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

const statusVariant = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('aprovad')) return 'secondary' as const;
  if (normalized.includes('progresso')) return 'outline' as const;
  if (normalized.includes('pendente')) return 'outline' as const;
  return 'outline' as const;
};

export default function DashboardHome() {
  const permissions = usePermissions();
  const { metrics, loading: metricsLoading } = useDashboardMetrics();
  const { items: activities, loading: activityLoading } = useDashboardActivity(3);
  const { items: pendingTasks, loading: pendingLoading } = usePendingTasks(5);

  const greetingName =
    permissions.user?.name || permissions.user?.email?.split('@')[0] || 'você';

  const metricsCards = [
    {
      label: 'Alunos Ativos',
      value: metrics.students,
      description: 'Alunos sob sua responsabilidade',
      icon: Users,
    },
    {
      label: 'Documentos',
      value: metrics.documents,
      description: 'PEI, PAEE e Estudos de Caso',
      icon: FileText,
    },
    {
      label: 'Metas Ativas',
      value: metrics.goals,
      description: 'Metas em acompanhamento',
      icon: Target,
    },
    {
      label: 'Confirmações',
      value: metrics.confirmations,
      description: 'Aguardando confirmação da família',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-8 lg:space-y-10 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Bem-vindo, {greetingName}!</h1>
          <p className="text-sm text-muted-foreground">
            Aqui está um resumo do que você precisa saber hoje.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-medium">
          v2 — Sistema Educacional
        </Badge>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricsCards.map((metric) => (
          <Card key={metric.label} className="shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <metric.icon className="h-4 w-4" />
                <span>{metric.label}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold">
              {metricsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                metric.value
              )}
            </div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <PermissionGate permission="canCreateDocument">
            <Button asChild className="min-w-[180px]">
              <Link href="/dashboard/documents/new">+ Novo Documento</Link>
            </Button>
          </PermissionGate>
          <PermissionGate permission="canCreateStudent">
            <Button variant="outline" asChild className="min-w-[180px]">
              <Link href="/dashboard/students">Adicionar Aluno</Link>
            </Button>
          </PermissionGate>
          <Button variant="outline" asChild className="min-w-[180px]" title="Relatórios e análises">
            <Link href="/dashboard/relatorios">Relatórios</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Tarefas Pendentes</h2>
        <div className="space-y-3">
          {pendingLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-9 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : pendingTasks.length ? (
            pendingTasks.map((task) => (
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
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhuma tarefa pendente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Documentos enviados para validação aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Atividade Recente</h2>
        <div className="space-y-3">
          {activityLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : activities.length ? (
            activities.map((activity) => (
              <Card key={`${activity.title}-${activity.created_at}`}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(activity.status)}>{activity.status}</Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhuma atividade recente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atualizações em documentos e metas aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
