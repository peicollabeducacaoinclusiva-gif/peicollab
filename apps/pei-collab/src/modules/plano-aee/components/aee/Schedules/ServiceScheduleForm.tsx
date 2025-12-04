// ============================================================================
// COMPONENTE: ServiceScheduleForm
// ============================================================================
// Formulário para criar/editar cronogramas de serviço AEE
// Data: 2025-02-20
// ============================================================================

import { useState, useEffect } from 'react';
import { useServiceSchedules } from '../../../hooks/useSchedules';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
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
import type {
  CreateServiceScheduleLinkInput,
  ScheduleType,
  ScheduleStatus,
  ScheduleFrequency,
  ScheduleLocation,
} from '../../../types/schedules.types';

interface ServiceScheduleFormProps {
  planId: string;
  studentId?: string;
  scheduleId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export function ServiceScheduleForm({
  planId,
  studentId,
  scheduleId,
  onClose,
  onSuccess,
}: ServiceScheduleFormProps) {
  const { schedules, createSchedule, updateSchedule } = useServiceSchedules(planId);

  const [formData, setFormData] = useState<CreateServiceScheduleLinkInput>({
    plan_id: planId,
    student_id: studentId,
    aee_teacher_id: '',
    schedule_type: 'individual_aee',
    frequency: 'weekly',
    status: 'active',
  });

  // Buscar professores AEE
  const { data: aeeTeachers } = useQuery({
    queryKey: ['aee-teachers', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'aee_teacher')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar grades existentes (class_schedules)
  const { data: classSchedules } = useQuery({
    queryKey: ['class-schedules', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('id, class_id, academic_year, classes(class_name, grade)')
        .order('academic_year', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Carregar dados do cronograma se estiver editando
  useEffect(() => {
    if (scheduleId) {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (schedule) {
        setFormData({
          plan_id: schedule.plan_id,
          schedule_id: schedule.schedule_id || undefined,
          student_id: schedule.student_id || undefined,
          aee_teacher_id: schedule.aee_teacher_id,
          schedule_type: schedule.schedule_type,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time || undefined,
          end_time: schedule.end_time || undefined,
          duration_minutes: schedule.duration_minutes || undefined,
          frequency: schedule.frequency,
          start_date: schedule.start_date || undefined,
          end_date: schedule.end_date || undefined,
          location_specific: schedule.location_specific || undefined,
          location_details: schedule.location_details || undefined,
          status: schedule.status,
          notes: schedule.notes || undefined,
        });
      }
    }
  }, [scheduleId, schedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scheduleId) {
      updateSchedule.mutate(
        {
          id: scheduleId,
          input: {
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            duration_minutes: formData.duration_minutes,
            frequency: formData.frequency,
            start_date: formData.start_date,
            end_date: formData.end_date,
            location_specific: formData.location_specific,
            location_details: formData.location_details,
            status: formData.status,
            notes: formData.notes,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      createSchedule.mutate(formData, {
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
            {scheduleId ? 'Editar Cronograma' : 'Novo Cronograma'}
          </DialogTitle>
          <DialogDescription>
            Configure o cronograma de atendimento AEE
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule_type">Tipo de Atendimento *</Label>
              <Select
                value={formData.schedule_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, schedule_type: value as ScheduleType })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_aee">AEE Individual</SelectItem>
                  <SelectItem value="group_aee">AEE em Grupo</SelectItem>
                  <SelectItem value="co_teaching">Co-ensino</SelectItem>
                  <SelectItem value="material_production">Produção de Materiais</SelectItem>
                  <SelectItem value="visit">Visita</SelectItem>
                  <SelectItem value="assessment">Avaliação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aee_teacher_id">Professor AEE *</Label>
              <Select
                value={formData.aee_teacher_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, aee_teacher_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor AEE" />
                </SelectTrigger>
                <SelectContent>
                  {aeeTeachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule_id">Vincular à Grade Existente (Opcional)</Label>
            <Select
              value={formData.schedule_id || ''}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  schedule_id: value || undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma grade (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não vincular</SelectItem>
                {classSchedules?.map((cs: any) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    {cs.classes?.class_name} - {cs.academic_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!formData.schedule_id && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Dia da Semana</Label>
                  <Select
                    value={formData.day_of_week?.toString() || ''}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        day_of_week: parseInt(value) || undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, frequency: value as ScheduleFrequency })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Horário de Início</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">Horário de Término</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location_specific">Local</Label>
              <Select
                value={formData.location_specific || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    location_specific: value as ScheduleLocation,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aee_room">Sala AEE</SelectItem>
                  <SelectItem value="regular_classroom">Sala Regular</SelectItem>
                  <SelectItem value="library">Biblioteca</SelectItem>
                  <SelectItem value="lab">Laboratório</SelectItem>
                  <SelectItem value="outside">Externo</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ScheduleStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o cronograma..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createSchedule.isPending || updateSchedule.isPending}
            >
              {scheduleId ? 'Atualizar' : 'Criar'} Cronograma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


