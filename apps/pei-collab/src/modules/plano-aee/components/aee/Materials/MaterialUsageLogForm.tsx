// ============================================================================
// COMPONENTE: MaterialUsageLogForm
// ============================================================================
// Formulário para criar/editar logs de uso de materiais
// Data: 2025-02-20
// ============================================================================

import { useState, useEffect } from 'react';
import { useMaterialUsageLogs } from '../../../hooks/useMaterials';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CreateMaterialUsageLogInput,
  MaterialUsageContext,
  StudentEngagement,
} from '../../../types/materials.types';

interface MaterialUsageLogFormProps {
  planId: string;
  studentId?: string;
  logId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaterialUsageLogForm({
  planId,
  studentId,
  logId,
  onClose,
  onSuccess,
}: MaterialUsageLogFormProps) {
  const { logs, createLog, updateLog } = useMaterialUsageLogs(planId);

  const [formData, setFormData] = useState<CreateMaterialUsageLogInput>({
    plan_id: planId,
    student_id: studentId || '',
    material_name: '',
    used_date: new Date().toISOString().split('T')[0],
    context: 'individual_aee',
    duration_minutes: 30,
  });

  const [date, setDate] = useState<Date | undefined>(
    formData.used_date ? new Date(formData.used_date) : new Date()
  );

  // Carregar dados do log se estiver editando
  useEffect(() => {
    if (logId) {
      const log = logs.find((l) => l.id === logId);
      if (log) {
        setFormData({
          plan_id: log.plan_id,
          student_id: log.student_id,
          material_name: log.material_name,
          material_type: log.material_type,
          material_reference_id: log.material_reference_id || undefined,
          material_reference_url: log.material_reference_url || undefined,
          used_date: log.used_date,
          context: log.context,
          how_used: log.how_used || undefined,
          duration_minutes: log.duration_minutes || undefined,
          effectiveness_feedback: log.effectiveness_feedback || undefined,
          effectiveness_rating: log.effectiveness_rating || undefined,
          student_response: log.student_response || undefined,
          student_engagement: log.student_engagement || undefined,
          learning_outcomes: log.learning_outcomes || undefined,
          improvements_suggested: log.improvements_suggested || undefined,
        });
        setDate(new Date(log.used_date));
      }
    }
  }, [logId, logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (logId) {
      updateLog.mutate(
        {
          id: logId,
          input: {
            how_used: formData.how_used,
            duration_minutes: formData.duration_minutes,
            effectiveness_feedback: formData.effectiveness_feedback,
            effectiveness_rating: formData.effectiveness_rating,
            student_response: formData.student_response,
            student_engagement: formData.student_engagement,
            learning_outcomes: formData.learning_outcomes,
            improvements_suggested: formData.improvements_suggested,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      createLog.mutate(formData, {
        onSuccess: () => {
          onSuccess();
        },
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {logId ? 'Editar Registro de Uso' : 'Novo Registro de Uso'}
          </DialogTitle>
          <DialogDescription>
            Registre o uso de um material de acessibilidade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material_name">Nome do Material *</Label>
            <Input
              id="material_name"
              value={formData.material_name}
              onChange={(e) =>
                setFormData({ ...formData, material_name: e.target.value })
              }
              required
              placeholder="Ex: Tabuleiro tátil para matemática"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="used_date">Data de Uso *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      if (d) {
                        setFormData({
                          ...formData,
                          used_date: d.toISOString().split('T')[0],
                        });
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Contexto de Uso</Label>
              <Select
                value={formData.context}
                onValueChange={(value) =>
                  setFormData({ ...formData, context: value as MaterialUsageContext })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_aee">AEE Individual</SelectItem>
                  <SelectItem value="group_aee">AEE em Grupo</SelectItem>
                  <SelectItem value="co_teaching">Co-ensino</SelectItem>
                  <SelectItem value="material_production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="how_used">Como foi utilizado</Label>
            <Textarea
              id="how_used"
              value={formData.how_used || ''}
              onChange={(e) => setFormData({ ...formData, how_used: e.target.value })}
              placeholder="Descreva como o material foi utilizado..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveness_rating">Avaliação de Eficácia (1-5)</Label>
              <Select
                value={formData.effectiveness_rating?.toString() || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    effectiveness_rating: parseInt(value) || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Muito Baixa</SelectItem>
                  <SelectItem value="2">2 - Baixa</SelectItem>
                  <SelectItem value="3">3 - Média</SelectItem>
                  <SelectItem value="4">4 - Alta</SelectItem>
                  <SelectItem value="5">5 - Muito Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_engagement">Engajamento do Aluno</Label>
              <Select
                value={formData.student_engagement || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    student_engagement: value as StudentEngagement,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning_outcomes">Resultados de Aprendizagem</Label>
            <Textarea
              id="learning_outcomes"
              value={formData.learning_outcomes || ''}
              onChange={(e) =>
                setFormData({ ...formData, learning_outcomes: e.target.value })
              }
              placeholder="Descreva os resultados de aprendizagem observados..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLog.isPending || updateLog.isPending}>
              {logId ? 'Atualizar' : 'Criar'} Registro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


