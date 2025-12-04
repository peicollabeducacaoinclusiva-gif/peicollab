// ============================================================================
// COMPONENTE: MaterialProductionForm
// ============================================================================
// Formulário para criar/editar sessões de produção de materiais
// Data: 2025-02-20
// ============================================================================

import { useState, useEffect } from 'react';
import { useMaterialProductionSessions } from '../../../hooks/useMaterials';
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
  CreateMaterialProductionSessionInput,
  MaterialType,
  MaterialProductionStatus,
} from '../../../types/materials.types';

interface MaterialProductionFormProps {
  planId: string;
  studentId?: string;
  sessionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaterialProductionForm({
  planId,
  studentId,
  sessionId,
  onClose,
  onSuccess,
}: MaterialProductionFormProps) {
  const { sessions, createSession, updateSession } = useMaterialProductionSessions(planId);

  const [formData, setFormData] = useState<CreateMaterialProductionSessionInput>({
    plan_id: planId,
    student_id: studentId,
    material_name: '',
    material_type: 'visual',
    purpose: '',
    target_disability: [],
    session_date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    production_steps: [],
    resources_used: [],
    status: 'planned',
  });

  const [date, setDate] = useState<Date | undefined>(
    formData.session_date ? new Date(formData.session_date) : new Date()
  );

  // Carregar dados da sessão se estiver editando
  useEffect(() => {
    if (sessionId) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setFormData({
          plan_id: session.plan_id,
          student_id: session.student_id || undefined,
          material_name: session.material_name,
          material_type: session.material_type,
          material_reference_id: session.material_reference_id || undefined,
          material_reference_url: session.material_reference_url || undefined,
          description: session.description || undefined,
          purpose: session.purpose,
          target_disability: session.target_disability,
          session_date: session.session_date,
          duration_minutes: session.duration_minutes,
          production_steps: session.production_steps,
          resources_used: session.resources_used,
          cost_estimate: session.cost_estimate || undefined,
          time_spent_minutes: session.time_spent_minutes || undefined,
          materials_cost: session.materials_cost || undefined,
          file_url: session.file_url || undefined,
          file_type: session.file_type || undefined,
          file_size: session.file_size || undefined,
          notes: session.notes || undefined,
          status: session.status,
        });
        setDate(new Date(session.session_date));
      }
    }
  }, [sessionId, sessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sessionId) {
      updateSession.mutate(
        {
          id: sessionId,
          input: {
            material_name: formData.material_name,
            description: formData.description,
            purpose: formData.purpose,
            target_disability: formData.target_disability,
            session_date: formData.session_date,
            duration_minutes: formData.duration_minutes,
            production_steps: formData.production_steps,
            resources_used: formData.resources_used,
            cost_estimate: formData.cost_estimate,
            time_spent_minutes: formData.time_spent_minutes,
            materials_cost: formData.materials_cost,
            notes: formData.notes,
            status: formData.status,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      createSession.mutate(formData, {
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
            {sessionId ? 'Editar Sessão de Produção' : 'Nova Sessão de Produção'}
          </DialogTitle>
          <DialogDescription>
            Registre a produção de materiais de acessibilidade para o plano AEE
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="material_type">Tipo de Material *</Label>
              <Select
                value={formData.material_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, material_type: value as MaterialType })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="tactile">Tátil</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="adaptation">Adaptação</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Finalidade *</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
              placeholder="Descreva a finalidade do material..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session_date">Data da Sessão *</Label>
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
                          session_date: d.toISOString().split('T')[0],
                        });
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (minutos) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value) || 0,
                  })
                }
                required
                min={1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as MaterialProductionStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planejada</SelectItem>
                <SelectItem value="in_progress">Em Produção</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a produção..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createSession.isPending || updateSession.isPending}
            >
              {sessionId ? 'Atualizar' : 'Criar'} Sessão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

