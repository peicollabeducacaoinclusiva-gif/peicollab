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
import type { StudentNee } from '@/hooks/useStudentNee';

type StudentNeeProps = {
  studentId: string;
  nee: StudentNee[];
  loading: boolean;
  error: string | null;
  onCreateNee: (area: string, descricao: string) => Promise<string | null>;
  onDeleteNee?: (neeId: string) => Promise<void>;
};

const AREA_LABELS: Record<string, string> = {
  desenvolvimento: 'Desenvolvimento',
  academica: 'Acadêmica',
  funcional: 'Funcional',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StudentNee({ studentId, nee, loading, error, onCreateNee, onDeleteNee }: StudentNeeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [area, setArea] = useState<string>('desenvolvimento');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!area || !descricao.trim()) return;
    setSaving(true);
    const id = await onCreateNee(area, descricao.trim());
    setSaving(false);
    if (id) {
      setDialogOpen(false);
      setDescricao('');
      setArea('desenvolvimento');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Necessidades Educacionais Específicas</CardTitle>
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
          <CardTitle>Necessidades Educacionais Específicas</CardTitle>
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
          <CardTitle>Necessidades Educacionais Específicas</CardTitle>
          <p className="text-sm text-muted-foreground">NEE identificadas para o aluno.</p>
        </CardHeader>
        <CardContent>
          <PermissionGate permission="canCreateDocument">
            <Button size="sm" className="mb-4" onClick={() => setDialogOpen(true)}>
              Adicionar NEE
            </Button>
          </PermissionGate>
          {nee.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma NEE cadastrada.</p>
          ) : (
            <ul className="space-y-3">
              {nee.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-2 border-l-2 border-muted pl-3 py-1">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {AREA_LABELS[n.area ?? ''] ?? n.area ?? 'Não informada'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{n.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(n.created_at)}
                      {n.criado_por_nome ? ` • por ${n.criado_por_nome}` : ''}
                    </p>
                  </div>
                  {onDeleteNee ? (
                    <PermissionGate permission="canCreateDocument">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteNee(n.id)}
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
            <DialogTitle>Adicionar NEE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="academica">Acadêmica</SelectItem>
                  <SelectItem value="funcional">Funcional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nee-descricao">Descrição</Label>
              <Textarea
                id="nee-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a necessidade educacional..."
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
