'use client';

import { useState } from 'react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { useGoalsOverview } from '@/hooks/useGoalsOverview';
import type { GoalOverview, GoalsFilter } from '@/hooks/useGoalsOverview';

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-';

const diasRestantes = (dataMeta: string | null, isAtrasada: boolean) => {
  if (!dataMeta) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const meta = new Date(dataMeta);
  meta.setHours(0, 0, 0, 0);
  const diff = Math.ceil((meta.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (isAtrasada) return 'Atrasado';
  return `${diff}d`;
};

const TABS: { id: GoalsFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'em_progresso', label: 'Em Progresso' },
  { id: 'concluidas', label: 'Concluídas' },
  { id: 'atrasadas', label: 'Atrasadas' },
];

export default function MetasPage() {
  const [filter, setFilter] = useState<GoalsFilter>('todas');
  const { goals, summary, loading, error } = useGoalsOverview(filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Acompanhamento de Metas</h1>
        <p className="text-sm text-muted-foreground">
          Visualize o progresso de todas as metas de seus alunos.
        </p>
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">{summary.total}</span>
              <p className="text-xs text-muted-foreground">Metas</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <span className="text-sm font-medium text-muted-foreground">Concluídas</span>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">{summary.concluidas}</span>
              <p className="text-xs text-muted-foreground">
                {summary.total > 0 ? Math.round((summary.concluidas / summary.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <span className="text-sm font-medium text-muted-foreground">Em Progresso</span>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">{summary.em_progresso}</span>
              <p className="text-xs text-muted-foreground">
                {summary.total > 0 ? Math.round((summary.em_progresso / summary.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <span className="text-sm font-medium text-muted-foreground">Atrasadas</span>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">{summary.atrasadas}</span>
              <p className="text-xs text-muted-foreground">
                {summary.total > 0 ? Math.round((summary.atrasadas / summary.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as GoalsFilter)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
              {summary && (
                <span className="ml-1 opacity-80">
                  (
                  {tab.id === 'todas'
                    ? summary.total
                    : tab.id === 'em_progresso'
                      ? summary.em_progresso
                      : tab.id === 'concluidas'
                        ? summary.concluidas
                        : summary.atrasadas}
                  )
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-4 pt-6">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta encontrada"
          description="Crie metas no perfil do aluno para acompanhar o progresso."
          action={{ label: 'Ver alunos', href: '/dashboard/students' }}
        />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: GoalOverview }) {
  const statusLabel = goal.is_atrasada
    ? 'Atrasada'
    : goal.status === 'concluida'
      ? 'Concluída'
      : 'Em Progresso';
  const statusVariant = goal.is_atrasada
    ? 'destructive'
    : goal.status === 'concluida'
      ? 'secondary'
      : 'default';
  const dias = diasRestantes(goal.data_meta, goal.is_atrasada);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{goal.titulo}</h3>
            <p className="text-sm text-muted-foreground">{goal.student_nome}</p>
          </div>
          <Badge
            variant={statusVariant}
            className={
              goal.is_atrasada
                ? 'bg-red-100 text-red-800'
                : goal.status === 'concluida'
                  ? 'bg-muted'
                  : 'bg-emerald-100 text-emerald-800'
            }
          >
            {statusLabel}
          </Badge>
        </div>
        {goal.descricao ? <p className="text-sm text-muted-foreground">{goal.descricao}</p> : null}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width]"
            style={{ width: `${Math.min(100, Math.max(0, goal.progresso ?? 0))}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Início: {formatDate(goal.data_inicio)}</span>
          <span>Meta: {formatDate(goal.data_meta)}</span>
          <span className={goal.is_atrasada ? 'font-medium text-red-600' : ''}>
            Dias Restantes: {dias ?? '-'}
          </span>
        </div>
        <Link
          href={`/dashboard/students/${goal.student_id}`}
          className="text-sm font-medium text-emerald-600 hover:underline"
        >
          Ver perfil do aluno →
        </Link>
      </CardContent>
    </Card>
  );
}
