'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGate } from '@/components/auth/PermissionGate';
import type { StudentBarrier } from '@/hooks/useStudentBarriers';

type StudentBarriersProps = {
  studentId: string;
  barriers: StudentBarrier[];
  loading: boolean;
  error: string | null;
  onCreateBarrier: (tipo: string, descricao: string) => Promise<string | null>;
  onDeleteBarrier?: (barrierId: string) => Promise<void>;
};

const TIPO_LABELS: Record<string, string> = {
  ambiente: 'Ambiente',
  estudante: 'Estudante',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StudentBarriers({
  studentId,
  barriers,
  loading,
  error,
  onCreateBarrier,
  onDeleteBarrier,
}: StudentBarriersProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipo, setTipo] = useState<string>('ambiente');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!tipo || !descricao.trim()) return;
    setSaving(true);
    const id = await onCreateBarrier(tipo, descricao.trim());
    setSaving(false);
    if (id) {
      setDialogOpen(false);
      setDescricao('');
      setTipo('ambiente');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Barreiras</CardTitle>
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
          <CardTitle>Barreiras</CardTitle>
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
          <CardTitle>Barreiras</CardTitle>
          <p className="text-sm text-muted-foreground">
            Barreiras que impedem ou dificultam a participação do aluno.
          </p>
        </CardHeader>
        <CardContent>
          <PermissionGate permission="canCreateDocument">
            <Button size="sm" className="mb-4" onClick={() => setDialogOpen(true)}>
              Adicionar barreira
            </Button>
          </PermissionGate>
          {barriers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma barreira cadastrada.</p>
          ) : (
            <ul className="space-y-3">
              {barriers.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-2 border-l-2 border-muted pl-3 py-1">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{TIPO_LABELS[b.tipo] ?? b.tipo}</Badge>
                    </div>
                    <p className="text-sm mt-1">{b.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.created_at)}
                      {b.criado_por_nome ? ` • por ${b.criado_por_nome}` : ''}
                    </p>
                  </div>
                  {onDeleteBarrier ? (
                    <PermissionGate permission="canCreateDocument">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteBarrier(b.id)}
                      >
                        Remover
                      </Button>
                    </PermissionGate>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar barreira</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambiente">Ambiente</SelectItem>
                  <SelectItem value="estudante">Estudante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barrier-descricao">Descrição</Label>
              <Textarea
                id="barrier-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a barreira..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!descricao.trim() || saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
