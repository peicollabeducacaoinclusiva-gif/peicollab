import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { mealService } from '../services/mealService';
import { toast } from 'sonner';
import { supabase } from '@pei/database';
import { format } from 'date-fns';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
};

interface AttendanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function AttendanceForm({ open, onOpenChange, schoolId, tenantId, onSuccess }: AttendanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [mealDate, setMealDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<string>('almoco');
  const [consumed, setConsumed] = useState(true);
  const [quantityServed, setQuantityServed] = useState<number | undefined>();
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (open) {
      loadStudents();
    }
  }, [open, schoolId, tenantId]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar lista de alunos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId) {
      toast.error('Selecione um aluno');
      return;
    }

    if (!mealDate) {
      toast.error('Selecione a data da refeição');
      return;
    }

    setLoading(true);
    try {
      await mealService.recordConsumption({
        studentId: selectedStudentId,
        schoolId,
        mealDate,
        mealType,
        consumed,
        quantityServed,
        observations: observations || undefined,
      });
      toast.success('Consumo registrado com sucesso');
      onOpenChange(false);
      // Reset form
      setSelectedStudentId('');
      setMealDate(format(new Date(), 'yyyy-MM-dd'));
      setMealType('almoco');
      setConsumed(true);
      setQuantityServed(undefined);
      setObservations('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao registrar consumo:', error);
      toast.error(error.message || 'Erro ao registrar consumo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Consumo de Refeição</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="student">Aluno *</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mealDate">Data da Refeição *</Label>
              <Input
                id="mealDate"
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="mealType">Tipo de Refeição *</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger id="mealType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="consumed"
              checked={consumed}
              onChange={(e) => setConsumed(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="consumed" className="cursor-pointer">
              Refeição foi consumida
            </Label>
          </div>

          <div>
            <Label htmlFor="quantityServed">Quantidade Servida</Label>
            <Input
              id="quantityServed"
              type="number"
              step="0.01"
              value={quantityServed || ''}
              onChange={(e) => setQuantityServed(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 1.5 (em porções)"
            />
          </div>

          <div>
            <Label htmlFor="observations">Observações</Label>
            <Input
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações sobre o consumo (opcional)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

