// ============================================================================
// COMPONENTE: VisitForm
// ============================================================================
// Formulário para criar/editar visitas escolares
// ============================================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useCreateSchoolVisit, useUpdateSchoolVisit } from '@/hooks/useSchoolVisits';
import type { SchoolVisit, VisitType } from '@/types/planoAEE.types';

// Schema de validação
const visitSchema = z.object({
  visit_type: z.enum(['diagnostica', 'acompanhamento', 'orientacao', 'avaliacao', 'outra']),
  visit_date: z.string().min(1, 'Data é obrigatória'),
  visit_time: z.string().optional(),
  duration_minutes: z.number().min(15).max(480),
  observations: z.string().optional(),
  class_environment: z.string().optional(),
  student_interaction: z.string().optional(),
  teacher_feedback: z.string().optional(),
  next_steps: z.string().optional(),
  follow_up_date: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface VisitFormProps {
  planId: string;
  studentId: string;
  schoolId: string;
  tenantId: string;
  visit?: SchoolVisit;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VisitForm({ 
  planId, 
  studentId, 
  schoolId, 
  tenantId, 
  visit, 
  onSuccess, 
  onCancel 
}: VisitFormProps) {
  const createVisit = useCreateSchoolVisit();
  const updateVisit = useUpdateSchoolVisit();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: visit ? {
      visit_type: visit.visit_type,
      visit_date: visit.visit_date.split('T')[0],
      visit_time: visit.visit_time,
      duration_minutes: visit.duration_minutes,
      observations: visit.observations,
      class_environment: visit.class_environment,
      student_interaction: visit.student_interaction,
      teacher_feedback: visit.teacher_feedback,
      next_steps: visit.next_steps,
      follow_up_date: visit.follow_up_date?.split('T')[0],
    } : {
      duration_minutes: 60,
      visit_type: 'acompanhamento',
    },
  });

  const onSubmit = async (data: VisitFormData) => {
    try {
      const payload = {
        ...data,
        plan_id: planId,
        student_id: studentId,
        school_id: schoolId,
        tenant_id: tenantId,
        aee_teacher_id: (await import('@/lib/supabase')).supabase.auth.getUser().then(u => u.data.user?.id || ''),
        participants: visit?.participants || [],
        orientations_given: visit?.orientations_given || [],
        resources_needed: visit?.resources_needed || [],
        suggested_adaptations: visit?.suggested_adaptations || [],
        attachments: visit?.attachments || [],
        signatures: visit?.signatures || {},
        status: visit?.status || 'rascunho',
        report_generated: visit?.report_generated || false,
      };

      if (visit) {
        await updateVisit.mutateAsync({ id: visit.id, ...payload });
      } else {
        await createVisit.mutateAsync(payload);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      alert('Erro ao salvar visita. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo e Data */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tipo de Visita *
          </label>
          <select
            {...register('visit_type')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="diagnostica">Diagnóstica</option>
            <option value="acompanhamento">Acompanhamento</option>
            <option value="orientacao">Orientação</option>
            <option value="avaliacao">Avaliação</option>
            <option value="outra">Outra</option>
          </select>
          {errors.visit_type && (
            <p className="text-sm text-red-500 mt-1">{errors.visit_type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Data da Visita *
          </label>
          <input
            type="date"
            {...register('visit_date')}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.visit_date && (
            <p className="text-sm text-red-500 mt-1">{errors.visit_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Horário
          </label>
          <input
            type="time"
            {...register('visit_time')}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Duração (minutos)
          </label>
          <input
            type="number"
            {...register('duration_minutes', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md"
            min="15"
            max="480"
            step="15"
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Observações Gerais
        </label>
        <textarea
          {...register('observations')}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Descreva as observações gerais da visita..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Ambiente da Sala de Aula
        </label>
        <textarea
          {...register('class_environment')}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Como é o ambiente? Há barreiras arquitetônicas? Acessibilidade?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Interação do Aluno
        </label>
        <textarea
          {...register('student_interaction')}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Como o aluno interage com colegas e professor? Participa das atividades?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Feedback do Professor Regente
        </label>
        <textarea
          {...register('teacher_feedback')}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="O que o professor regente relatou sobre o aluno?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Próximos Passos
        </label>
        <textarea
          {...register('next_steps')}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
          placeholder="Ações a serem tomadas após esta visita..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Data de Follow-up
        </label>
        <input
          type="date"
          {...register('follow_up_date')}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : visit ? 'Atualizar' : 'Criar Visita'}
        </Button>
      </div>
    </form>
  );
}


