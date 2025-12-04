// ============================================================================
// COMPONENTE: AttendanceDialog
// ============================================================================
// Dialog wrapper para o diário de frequência
// ============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AttendanceSheet } from './AttendanceSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  initialDate?: string;
  subjects?: Array<{ id: string; nome: string }>;
}

export function AttendanceDialog({
  open,
  onOpenChange,
  classId,
  initialDate,
  subjects,
}: AttendanceDialogProps) {
  const [date, setDate] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [subjectId, setSubjectId] = useState<string | undefined>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diário de Classe</DialogTitle>
          <DialogDescription>
            Registre a frequência dos alunos. Funciona offline!
          </DialogDescription>
        </DialogHeader>

        {/* Seletores de data e disciplina */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {subjects && subjects.length > 0 && (
            <div>
              <Label htmlFor="subject">Disciplina (opcional)</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Geral (todas as disciplinas)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">Geral</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <AttendanceSheet
          classId={classId}
          date={date}
          subjectId={subjectId === 'undefined' ? undefined : subjectId}
        />
      </DialogContent>
    </Dialog>
  );
}






























