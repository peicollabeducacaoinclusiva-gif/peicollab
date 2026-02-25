'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGate } from '@/components/auth/PermissionGate';
import type { Meeting } from '@/hooks/useMeetings';

type StudentMeetingsProps = {
  studentId: string;
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  onCreateMeeting: (dataReuniao: string, tema: string) => Promise<string | null>;
};

const TEMA_LABELS: Record<string, string> = {
  criacao_pei: 'Criação do PEI',
  revisao_pei: 'Revisão do PEI',
  outro: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  cancelada: 'Cancelada',
  realizada: 'Realizada',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StudentMeetings({
  studentId,
  meetings,
  loading,
  error,
  onCreateMeeting,
}: StudentMeetingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dataReuniao, setDataReuniao] = useState('');
  const [tema, setTema] = useState<string>('criacao_pei');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!dataReuniao || !tema) return;
    setSaving(true);
    const iso = new Date(dataReuniao).toISOString();
    const id = await onCreateMeeting(iso, tema);
    setSaving(false);
    if (id) {
      setDialogOpen(false);
      setDataReuniao('');
      setTema('criacao_pei');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reuniões</CardTitle>
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
          <CardTitle>Reuniões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Reuniões</CardTitle>
          <p className="text-sm text-muted-foreground">Reuniões vinculadas ao aluno.</p>
        </CardHeader>
        <CardContent>
          <PermissionGate permission="canCreateDocument">
            <Button size="sm" className="mb-4" onClick={() => setDialogOpen(true)}>
              Agendar reunião
            </Button>
          </PermissionGate>
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma reunião agendada.</p>
          ) : (
            <ul className="space-y-3">
              {meetings.map((m) => (
                <li key={m.id} className="border-l-2 border-muted pl-3 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{TEMA_LABELS[m.tema] ?? m.tema}</span>
                    <Badge variant={m.status === 'agendada' ? 'secondary' : 'outline'}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(m.data_reuniao)}
                    {m.criado_por_nome ? ` • por ${m.criado_por_nome}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-reuniao">Data e hora</Label>
              <Input
                id="data-reuniao"
                type="datetime-local"
                value={dataReuniao}
                onChange={(e) => setDataReuniao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select value={tema} onValueChange={setTema}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="criacao_pei">Criação do PEI</SelectItem>
                  <SelectItem value="revisao_pei">Revisão do PEI</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!dataReuniao || saving}>
                {saving ? 'Agendando...' : 'Agendar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
