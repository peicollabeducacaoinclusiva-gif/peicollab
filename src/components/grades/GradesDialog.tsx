// ============================================================================
// COMPONENTE: GradesDialog
// ============================================================================
// Dialog wrapper para lançamento de notas
// ============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GradesEntry } from './GradesEntry';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GradesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  subjects: Array<{ id: string; nome: string }>;
}

const periodos = [
  { value: '1', label: '1º Bimestre' },
  { value: '2', label: '2º Bimestre' },
  { value: '3', label: '3º Bimestre' },
  { value: '4', label: '4º Bimestre' },
  { value: 'final', label: 'Final' },
  { value: 'recuperacao', label: 'Recuperação' },
];

const tiposAvaliacao = [
  { value: 'prova', label: 'Prova' },
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'participacao', label: 'Participação' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'seminario', label: 'Seminário' },
  { value: 'outro', label: 'Outro' },
];

export function GradesDialog({
  open,
  onOpenChange,
  classId,
  subjects,
}: GradesDialogProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [periodo, setPeriodo] = useState('1');
  const [tipoAvaliacao, setTipoAvaliacao] = useState('prova');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançamento de Notas</DialogTitle>
          <DialogDescription>
            Lance as notas dos alunos por disciplina e período
          </DialogDescription>
        </DialogHeader>

        {/* Seletores */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="subject">Disciplina *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="periodo">Período *</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Avaliação *</Label>
            <Select value={tipoAvaliacao} onValueChange={setTipoAvaliacao}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposAvaliacao.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {subjectId && (
          <GradesEntry
            classId={classId}
            subjectId={subjectId}
            periodo={periodo}
            tipo_avaliacao={tipoAvaliacao}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

