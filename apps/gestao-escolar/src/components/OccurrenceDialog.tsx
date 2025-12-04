import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { occurrenceService, type OccurrenceType, type OccurrenceSeverity } from '../services/occurrenceService';
import { toast } from 'sonner';

interface OccurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  enrollmentId?: string;
  classId: string;
  subjectId?: string;
  diaryEntryId?: string;
  date: string;
  tenantId: string;
  userId: string;
  onSave?: () => void;
}

const OCCURRENCE_TYPES: Record<OccurrenceType, string> = {
  behavioral: 'Comportamental',
  pedagogical: 'Pedagógica',
  administrative: 'Administrativa',
  attendance: 'Frequência',
  other: 'Outra',
};

const SEVERITY_LABELS: Record<OccurrenceSeverity, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const SEVERITY_COLORS: Record<OccurrenceSeverity, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function OccurrenceDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  enrollmentId,
  classId,
  subjectId,
  diaryEntryId,
  date,
  tenantId,
  userId,
  onSave,
}: OccurrenceDialogProps) {
  const [occurrenceType, setOccurrenceType] = useState<OccurrenceType>('behavioral');
  const [severity, setSeverity] = useState<OccurrenceSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [witnesses, setWitnesses] = useState<string>('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || !description.trim()) {
      toast.error('Preencha título e descrição');
      return;
    }

    try {
      setSaving(true);

      const witnessesArray = witnesses
        .split('\n')
        .map(w => w.trim())
        .filter(w => w.length > 0);

      await occurrenceService.createOccurrence({
        tenant_id: tenantId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        class_id: classId,
        subject_id: subjectId,
        diary_entry_id: diaryEntryId,
        occurrence_type: occurrenceType,
        severity: severity,
        title: title.trim(),
        description: description.trim(),
        date: date,
        location: location.trim() || undefined,
        witnesses: witnessesArray.length > 0 ? witnessesArray : undefined,
        actions_taken: actionsTaken.trim() || undefined,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate || undefined,
        reported_by: userId,
        status: 'open',
      });

      toast.success('Ocorrência registrada com sucesso');
      resetForm();
      onOpenChange(false);
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error('Erro ao salvar ocorrência:', error);
      toast.error(error.message || 'Erro ao salvar ocorrência');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setOccurrenceType('behavioral');
    setSeverity('medium');
    setTitle('');
    setDescription('');
    setLocation('');
    setWitnesses('');
    setActionsTaken('');
    setFollowUpRequired(false);
    setFollowUpDate('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Registrar Ocorrência
          </DialogTitle>
          <DialogDescription>
            Aluno: {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occurrenceType">Tipo de Ocorrência *</Label>
              <Select value={occurrenceType} onValueChange={(value) => setOccurrenceType(value as OccurrenceType)}>
                <SelectTrigger id="occurrenceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OCCURRENCE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Gravidade *</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as OccurrenceSeverity)}>
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge className={SEVERITY_COLORS[key as OccurrenceSeverity]}>
                          {label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Atraso na aula de Matemática"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente a ocorrência..."
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Local (Opcional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Sala de aula, Pátio"
              />
            </div>

            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="witnesses">Testemunhas (Opcional)</Label>
            <Textarea
              id="witnesses"
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
              placeholder="Uma testemunha por linha..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite uma testemunha por linha
            </p>
          </div>

          <div>
            <Label htmlFor="actionsTaken">Ações Tomadas (Opcional)</Label>
            <Textarea
              id="actionsTaken"
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="Descreva as ações já tomadas..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="followUpRequired"
              checked={followUpRequired}
              onCheckedChange={(checked) => setFollowUpRequired(checked === true)}
            />
            <Label htmlFor="followUpRequired" className="cursor-pointer">
              Requer acompanhamento
            </Label>
          </div>

          {followUpRequired && (
            <div>
              <Label htmlFor="followUpDate">Data para Acompanhamento</Label>
              <Input
                id="followUpDate"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              onOpenChange(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Registrar Ocorrência'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

