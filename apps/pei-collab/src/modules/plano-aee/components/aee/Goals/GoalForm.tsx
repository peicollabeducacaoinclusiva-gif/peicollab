// ============================================================================
// COMPONENTE: GoalForm
// ============================================================================
// Formulário para criar/editar metas SMART do plano de AEE
// Data: 2025-01-09
// ============================================================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';;
import type {
  CreatePlanGoalInput,
  UpdatePlanGoalInput,
  GoalArea,
  GoalPriority,
} from '../../../types/planoAEE.types';
import { GOAL_AREA_LABELS, GOAL_PRIORITY_ICONS } from '../../../types/planoAEE.types';

// ============================================================================
// SCHEMA DE VALIDAÇÃO
// ============================================================================

const goalSchema = z.object({
  goal_description: z
    .string()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  goal_area: z.enum([
    'percepcao',
    'linguagem',
    'motora',
    'socio_emocional',
    'autonomia',
    'academica',
    'geral',
  ]),
  target_date: z.string().optional(),
  activities: z.string().max(1000).optional(),
  materials_needed: z.string().max(500).optional(),
  strategies: z.string().max(1000).optional(),
  success_criteria: z.string().max(500).optional(),
  priority: z.enum(['baixa', 'media', 'alta']).default('media'),
});

// ============================================================================
// PROPS
// ============================================================================

interface GoalFormProps {
  planId: string;
  initialData?: Partial<UpdatePlanGoalInput>;
  onSubmit: (data: CreatePlanGoalInput | UpdatePlanGoalInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function GoalForm({ planId, initialData, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const form = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_description: initialData?.goal_description || '',
      goal_area: initialData?.goal_area || ('geral' as GoalArea),
      target_date: initialData?.target_date || '',
      activities: initialData?.activities || '',
      materials_needed: initialData?.materials_needed || '',
      strategies: initialData?.strategies || '',
      success_criteria: initialData?.success_criteria || '',
      priority: initialData?.priority || ('media' as GoalPriority),
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (initialData) {
      onSubmit(data as UpdatePlanGoalInput);
    } else {
      onSubmit({ ...data, plan_id: planId } as CreatePlanGoalInput);
    }
  });

  const goalAreas: { value: GoalArea; label: string }[] = Object.entries(GOAL_AREA_LABELS).map(
    ([value, label]) => ({
      value: value as GoalArea,
      label,
    })
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrição da Meta */}
        <FormField
          control={form.control}
          name="goal_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Meta (SMART) *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Ex: O aluno será capaz de identificar corretamente 8 de 10 letras do alfabeto em atividades práticas, com 80% de acerto, até junho de 2025"
                  rows={4}
                  className="resize-none"
                />
              </FormControl>
              <FormDescription className="text-xs">
                <strong>Dica SMART:</strong> Específica, Mensurável, Atingível, Relevante, Temporal
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Área de Desenvolvimento e Prioridade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="goal_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área de Desenvolvimento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {goalAreas.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="baixa">{GOAL_PRIORITY_ICONS.baixa} Baixa</SelectItem>
                    <SelectItem value="media">{GOAL_PRIORITY_ICONS.media} Média</SelectItem>
                    <SelectItem value="alta">{GOAL_PRIORITY_ICONS.alta} Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Data Alvo */}
        <FormField
          control={form.control}
          name="target_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Alvo</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Quando você espera que esta meta seja alcançada?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Atividades */}
        <FormField
          control={form.control}
          name="activities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atividades</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descreva as atividades que serão realizadas para alcançar esta meta..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Materiais Necessários */}
        <FormField
          control={form.control}
          name="materials_needed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Materiais Necessários</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Liste os materiais e recursos necessários..."
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estratégias Pedagógicas */}
        <FormField
          control={form.control}
          name="strategies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estratégias Pedagógicas</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descreva as estratégias e metodologias que serão utilizadas..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Critérios de Sucesso */}
        <FormField
          control={form.control}
          name="success_criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critérios de Sucesso</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Como saberemos que a meta foi alcançada? Ex: Acerto de 80% em 3 avaliações consecutivas"
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ações */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Salvando...' : initialData ? 'Atualizar Meta' : 'Criar Meta'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}


