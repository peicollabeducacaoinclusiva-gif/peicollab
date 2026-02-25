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
import type { StudentRestriction } from '@/hooks/useStudentRestrictions';

type StudentRestrictionsProps = {
  studentId: string;
  restrictions: StudentRestriction[];
  loading: boolean;
  error: string | null;
  onCreateRestriction: (tipo: string, descricao: string) => Promise<string | null>;
};

const TIPO_LABELS: Record<string, string> = {
  medicacao: 'Medicação',
  alergia: 'Alergia',
  alimentacao: 'Alimentação',
  atividade: 'Atividade',
  outro: 'Outro',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StudentRestrictions({
  studentId,
  restrictions,
  loading,
  error,
  onCreateRestriction,
}: StudentRestrictionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipo, setTipo] = useState<string>('medicacao');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!tipo || !descricao.trim()) return;
    setSaving(true);
    const id = await onCreateRestriction(tipo, descricao.trim());
    setSaving(false);
    if (id) {
      setDialogOpen(false);
      setDescricao('');
      setTipo('medicacao');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Restrições</CardTitle>
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
          <CardTitle>Restrições</CardTitle>
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
          <CardTitle>Restrições</CardTitle>
          <p className="text-sm text-muted-foreground">
            Restrições médicas, alimentares ou de atividade do aluno.
          </p>
        </CardHeader>
        <CardContent>
          <PermissionGate permission="canCreateDocument">
            <Button size="sm" className="mb-4" onClick={() => setDialogOpen(true)}>
              Adicionar restrição
            </Button>
          </PermissionGate>
          {restrictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma restrição cadastrada.</p>
          ) : (
            <ul className="space-y-3">
              {restrictions.map((r) => (
                <li key={r.id} className="border-l-2 border-muted pl-3 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{TIPO_LABELS[r.tipo] ?? r.tipo}</Badge>
                  </div>
                  <p className="text-sm mt-1">{r.descricao}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar restrição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicacao">Medicação</SelectItem>
                  <SelectItem value="alergia">Alergia</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="atividade">Atividade</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restriction-descricao">Descrição</Label>
              <Textarea
                id="restriction-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a restrição..."
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
