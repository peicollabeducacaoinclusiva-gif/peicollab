'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TimelineEvent, TimelineEventType } from '@/hooks/useStudentTimeline';

type StudentTimelineProps = {
  studentId: string;
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
};

const TIPO_LABELS: Record<string, string> = {
  estudo_caso: 'Estudo de Caso',
  paee: 'PAEE',
  pei: 'PEI',
};

const EVENT_LABELS: Record<TimelineEventType, string> = {
  document_created: 'Documento criado',
  document_approved: 'Documento aprovado',
  document_rejected: 'Documento rejeitado',
  document_version_created: 'Nova versão criada',
  family_confirmed: 'Família confirmou',
  family_rejected: 'Família rejeitou',
  goal_created: 'Meta criada',
  comment_created: 'Comentário adicionado',
  meeting_scheduled: 'Reunião agendada',
};

const EVENT_ICONS: Record<TimelineEventType, string> = {
  document_created: '📄',
  document_approved: '✅',
  document_rejected: '❌',
  document_version_created: '🔄',
  family_confirmed: '👍',
  family_rejected: '👎',
  goal_created: '🎯',
  comment_created: '💬',
  meeting_scheduled: '📅',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function StudentTimeline({ studentId, events, loading, error }: StudentTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linha do tempo</CardTitle>
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
          <CardTitle>Linha do tempo</CardTitle>
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
        <CardTitle>Linha do tempo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ações, versões e confirmações vinculadas ao aluno.
        </p>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
            {events.map((event) => (
              <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm">
                  {EVENT_ICONS[event.type] ?? '•'}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{EVENT_LABELS[event.type]}</span>
                    {event.tipo ? (
                      <Badge variant="outline" className="text-xs">
                        {TIPO_LABELS[event.tipo] ?? event.tipo}
                      </Badge>
                    ) : null}
                    {event.nova_versao ? (
                      <Badge variant="secondary" className="text-xs">
                        v{event.nova_versao}
                      </Badge>
                    ) : null}
                  </div>
                  {event.titulo ? (
                    <p className="text-sm text-muted-foreground">{event.titulo}</p>
                  ) : null}
                  {event.user_name ? (
                    <p className="text-xs text-muted-foreground">por {event.user_name}</p>
                  ) : null}
                  {event.motivo ? <p className="text-xs text-destructive">{event.motivo}</p> : null}
                  {event.tema ? (
                    <p className="text-xs text-muted-foreground">
                      {event.tema === 'criacao_pei'
                        ? 'Criação do PEI'
                        : event.tema === 'revisao_pei'
                          ? 'Revisão do PEI'
                          : 'Outro'}{' '}
                      • {event.data_reuniao ? formatDate(event.data_reuniao) : ''}
                    </p>
                  ) : null}
                  {event.content_preview ? (
                    <p className="text-xs text-muted-foreground italic">
                      &quot;{event.content_preview}&quot;
                    </p>
                  ) : null}
                  {event.document_id ? (
                    <Link
                      href={`/dashboard/students/${studentId}/documents/${event.document_id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver documento →
                    </Link>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
