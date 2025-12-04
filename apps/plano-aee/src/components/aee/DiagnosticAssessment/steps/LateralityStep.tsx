// ============================================================================
// STEP: Laterality
// ============================================================================
// Etapa 2: Avaliação de Lateralidade
// ============================================================================

import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  Checkbox,
  Label,
} from '@/components/ui';
import type { CreateAssessmentInput, DominanceType } from '../../../../types/assessment.types';

export function LateralityStep() {
  const { control, watch, setValue } = useFormContext<CreateAssessmentInput>();

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-900">
          <strong>O que avaliar:</strong> Dominância lateral (mão, pé, olho, ouvido) e uso correto.
        </p>
      </div>

      {/* Dominância */}
      <FormField
        control={control}
        name="laterality.dominancia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dominância Lateral *</FormLabel>
            <Select 
              onValueChange={(value) => {
                const laterality = watch('laterality') || {};
                setValue('laterality', { ...laterality, dominancia: value as DominanceType });
              }}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="direita">🔵 Direita</SelectItem>
                <SelectItem value="esquerda">🔵 Esquerda</SelectItem>
                <SelectItem value="cruzada">🔀 Cruzada (ex: mão direita, olho esquerdo)</SelectItem>
                <SelectItem value="indefinida">❓ Indefinida</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Usa Corretamente */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="usa_corretamente"
          checked={watch('laterality')?.usa_corretamente || false}
          onCheckedChange={(checked) => {
            const laterality = watch('laterality') || {};
            setValue('laterality', { ...laterality, usa_corretamente: checked as boolean });
          }}
        />
        <div>
          <Label htmlFor="usa_corretamente" className="cursor-pointer">
            Usa a lateralidade corretamente nas atividades
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Ex: Segura lápis, tesoura, talheres com a mão dominante
          </p>
        </div>
      </div>

      {/* Observações */}
      <FormItem>
        <FormLabel>Observações</FormLabel>
        <FormControl>
          <Textarea
            value={watch('laterality')?.observacoes || ''}
            onChange={(e) => {
              const laterality = watch('laterality') || {};
              setValue('laterality', { ...laterality, observacoes: e.target.value });
            }}
            placeholder="Observações sobre a lateralidade do aluno..."
            rows={3}
          />
        </FormControl>
      </FormItem>
    </div>
  );
}






























