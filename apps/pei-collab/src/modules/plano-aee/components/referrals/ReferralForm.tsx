// ============================================================================
// COMPONENTE: ReferralForm
// ============================================================================
// Formulário para criar/editar encaminhamentos especializados
// ============================================================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useCreateReferral, useUpdateReferral } from '@/hooks/useReferrals';
import type { Referral } from '@/types/planoAEE.types';

const referralSchema = z.object({
  specialist_type: z.string().min(1, 'Tipo de especialista é obrigatório'),
  specialist_name: z.string().optional(),
  institution: z.string().optional(),
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
  symptoms_observed: z.string().optional(),
  urgency_level: z.enum(['baixa', 'media', 'alta', 'urgente']),
  contact_telefone: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contact_endereco: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralSchema>;

interface ReferralFormProps {
  planId: string;
  studentId: string;
  schoolId: string;
  tenantId: string;
  referral?: Referral;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const specialistTypes = [
  'Psicólogo',
  'Fonoaudiólogo',
  'Terapeuta Ocupacional',
  'Neurologista',
  'Oftalmologista',
  'Otorrinolaringologista',
  'Psicopedagogo',
  'Fisioterapeuta',
  'Nutricionista',
  'Outro',
];

export function ReferralForm({
  planId,
  studentId,
  schoolId,
  tenantId,
  referral,
  onSuccess,
  onCancel,
}: ReferralFormProps) {
  const createReferral = useCreateReferral();
  const updateReferral = useUpdateReferral();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: referral ? {
      specialist_type: referral.specialist_type,
      specialist_name: referral.specialist_name,
      institution: referral.institution,
      reason: referral.reason,
      symptoms_observed: referral.symptoms_observed,
      urgency_level: referral.urgency_level,
      contact_telefone: referral.contact_info.telefone,
      contact_email: referral.contact_info.email,
      contact_endereco: referral.contact_info.endereco,
    } : {
      urgency_level: 'media',
    },
  });

  const onSubmit = async (data: ReferralFormData) => {
    try {
      const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
      
      const payload = {
        plan_id: planId,
        student_id: studentId,
        school_id: schoolId,
        tenant_id: tenantId,
        referral_date: referral?.referral_date || new Date().toISOString(),
        specialist_type: data.specialist_type,
        specialist_name: data.specialist_name,
        institution: data.institution,
        reason: data.reason,
        symptoms_observed: data.symptoms_observed,
        urgency_level: data.urgency_level,
        requested_by: user?.id || '',
        contact_info: {
          telefone: data.contact_telefone,
          email: data.contact_email,
          endereco: data.contact_endereco,
        },
        status: referral?.status || 'rascunho',
        attachments: referral?.attachments || [],
        follow_up_needed: referral?.follow_up_needed || false,
        integrated_to_plan: referral?.integrated_to_plan || false,
      };

      if (referral) {
        await updateReferral.mutateAsync({ id: referral.id, ...payload });
      } else {
        await createReferral.mutateAsync(payload);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar encaminhamento:', error);
      alert('Erro ao salvar encaminhamento. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo de Especialista */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Tipo de Especialista *
        </label>
        <select
          {...register('specialist_type')}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Selecione...</option>
          {specialistTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.specialist_type && (
          <p className="text-sm text-red-500 mt-1">{errors.specialist_type.message}</p>
        )}
      </div>

      {/* Dados do Especialista */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nome do Especialista
          </label>
          <input
            type="text"
            {...register('specialist_name')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Nome completo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Instituição/Clínica
          </label>
          <input
            type="text"
            {...register('institution')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Nome da instituição"
          />
        </div>
      </div>

      {/* Urgência */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Nível de Urgência *
        </label>
        <select
          {...register('urgency_level')}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Motivo do Encaminhamento *
        </label>
        <textarea
          {...register('reason')}
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
          placeholder="Descreva o motivo do encaminhamento..."
        />
        {errors.reason && (
          <p className="text-sm text-red-500 mt-1">{errors.reason.message}</p>
        )}
      </div>

      {/* Sintomas Observados */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Sintomas/Comportamentos Observados
        </label>
        <textarea
          {...register('symptoms_observed')}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Descreva os sintomas ou comportamentos observados..."
        />
      </div>

      {/* Contato */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Informações de Contato (opcional)</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Telefone
            </label>
            <input
              type="tel"
              {...register('contact_telefone')}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('contact_email')}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="email@exemplo.com"
            />
            {errors.contact_email && (
              <p className="text-sm text-red-500 mt-1">{errors.contact_email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Endereço
          </label>
          <input
            type="text"
            {...register('contact_endereco')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Rua, número, bairro, cidade"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : referral ? 'Atualizar' : 'Criar Encaminhamento'}
        </Button>
      </div>
    </form>
  );
}































