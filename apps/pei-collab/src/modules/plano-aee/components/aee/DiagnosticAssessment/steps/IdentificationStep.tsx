// ============================================================================
// STEP: Identification
// ============================================================================
// Etapa 1: Identificação do aluno e dados básicos da avaliação
// ============================================================================

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';;
import { ASSESSMENT_TYPE_LABELS } from '../../../../types/assessment.types';
import type { CreateAssessmentInput } from '../../../../types/assessment.types';

export function IdentificationStep() {
  const { control } = useFormContext<CreateAssessmentInput>();

  return (
    <div className="space-y-6">
      {/* Data da Avaliação */}
      <FormField
        control={control}
        name="assessment_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data da Avaliação *</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tipo de Avaliação */}
      <FormField
        control={control}
        name="assessment_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Avaliação *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="inicial">{ASSESSMENT_TYPE_LABELS.inicial}</SelectItem>
                <SelectItem value="continuada">{ASSESSMENT_TYPE_LABELS.continuada}</SelectItem>
                <SelectItem value="final">{ASSESSMENT_TYPE_LABELS.final}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Informações */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Dica:</strong> Esta avaliação será usada para identificar potencialidades e
          barreiras do aluno, e para gerar sugestões automáticas de metas e estratégias.
        </p>
      </div>
    </div>
  );
}































