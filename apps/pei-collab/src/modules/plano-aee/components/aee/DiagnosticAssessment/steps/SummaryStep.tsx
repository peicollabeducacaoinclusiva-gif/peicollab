// ============================================================================
// STEP: Summary
// ============================================================================
// Etapa 9: Resumo, observações finais e recomendações
// ============================================================================

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';;
import type { CreateAssessmentInput } from '../../../../types/assessment.types';

export function SummaryStep() {
  const { control, watch } = useFormContext<CreateAssessmentInput>();

  // Contar campos preenchidos para mostrar resumo
  const countFilledFields = () => {
    const data = watch();
    let count = 0;
    
    if (data.laterality && Object.keys(data.laterality).length > 0) count++;
    if (data.reading_skills && Object.keys(data.reading_skills).length > 0) count++;
    if (data.motor_coordination && Object.keys(data.motor_coordination).length > 0) count++;
    // etc...
    
    return count;
  };

  const filledCount = countFilledFields();

  return (
    <div className="space-y-6">
      {/* Resumo do Preenchimento */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Progresso da Avaliação</p>
              <p className="text-xs text-muted-foreground">
                {filledCount} de 8 áreas avaliadas
              </p>
            </div>
            <Badge className="bg-green-600">
              {filledCount === 8 ? '✅ Completo' : `${filledCount}/8`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Queixas da Escola */}
      <FormField
        control={control}
        name="school_complaints"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Queixas da Escola</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Principais queixas e preocupações relatadas pela escola..."
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Indicações Clínicas */}
      <FormField
        control={control}
        name="clinical_indications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Indicações Clínicas</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Indicações de acompanhamento clínico (médico, terapêutico, etc.)..."
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Observações Gerais */}
      <FormField
        control={control}
        name="observations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações Gerais da Avaliação</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Observações gerais sobre a avaliação, comportamento do aluno durante a aplicação, etc..."
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Recomendações */}
      <FormField
        control={control}
        name="recommendations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Recomendações</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Recomendações para o plano de AEE, recursos necessários, encaminhamentos sugeridos..."
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Alerta Final */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>✨ Ao finalizar:</strong> O sistema irá gerar automaticamente sugestões de barreiras e metas SMART baseadas nesta avaliação!
        </p>
      </div>
    </div>
  );
}































