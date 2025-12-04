// ============================================================================
// STEP: Reading
// ============================================================================
// Etapa 6: Avaliação de Leitura
// ============================================================================

import { useFormContext } from 'react-hook-form';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';;
import type { CreateAssessmentInput } from '../../../../types/assessment.types';

export function ReadingStep() {
  const { watch, setValue } = useFormContext<CreateAssessmentInput>();

  const readingSkills = watch('reading_skills') || {};

  const updateReadingSkill = (field: string, value: any) => {
    setValue('reading_skills', { ...readingSkills, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>O que avaliar:</strong> Reconhecimento de letras, leitura de palavras, frases, compreensão e fluência.
        </p>
      </div>

      {/* Reconhece Letras */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="reconhece_letras"
          checked={readingSkills.reconhece_letras || false}
          onCheckedChange={(checked) => updateReadingSkill('reconhece_letras', checked)}
        />
        <div>
          <Label htmlFor="reconhece_letras" className="cursor-pointer">
            Reconhece letras do alfabeto
          </Label>
          <p className="text-xs text-muted-foreground">Identifica letras isoladas</p>
        </div>
      </div>

      {/* Lê Sílabas */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="le_silabas"
          checked={readingSkills.le_silabas || false}
          onCheckedChange={(checked) => updateReadingSkill('le_silabas', checked)}
        />
        <div>
          <Label htmlFor="le_silabas" className="cursor-pointer">
            Lê sílabas simples
          </Label>
          <p className="text-xs text-muted-foreground">BA, CA, PA, etc.</p>
        </div>
      </div>

      {/* Lê Palavras */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="le_palavras"
          checked={readingSkills.le_palavras || false}
          onCheckedChange={(checked) => updateReadingSkill('le_palavras', checked)}
        />
        <div>
          <Label htmlFor="le_palavras" className="cursor-pointer">
            Lê palavras simples
          </Label>
          <p className="text-xs text-muted-foreground">BOLA, CASA, GATO, etc.</p>
        </div>
      </div>

      {/* Lê Frases */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="le_frases"
          checked={readingSkills.le_frases || false}
          onCheckedChange={(checked) => updateReadingSkill('le_frases', checked)}
        />
        <div>
          <Label htmlFor="le_frases" className="cursor-pointer">
            Lê frases simples
          </Label>
          <p className="text-xs text-muted-foreground">O GATO BEBE LEITE</p>
        </div>
      </div>

      {/* Compreende Leitura */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="compreende_leitura"
          checked={readingSkills.compreende_leitura || false}
          onCheckedChange={(checked) => updateReadingSkill('compreende_leitura', checked)}
        />
        <div>
          <Label htmlFor="compreende_leitura" className="cursor-pointer">
            Compreende o que lê
          </Label>
          <p className="text-xs text-muted-foreground">Consegue responder perguntas sobre o texto</p>
        </div>
      </div>

      {/* Fluência */}
      <FormItem>
        <FormLabel>Fluência de Leitura</FormLabel>
        <Select
          value={readingSkills.fluencia || ''}
          onValueChange={(value) => updateReadingSkill('fluencia', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adequada">✅ Adequada</SelectItem>
            <SelectItem value="lenta">⏱️ Lenta</SelectItem>
            <SelectItem value="muito_lenta">🐌 Muito Lenta</SelectItem>
          </SelectContent>
        </Select>
      </FormItem>

      {/* Observações */}
      <FormItem>
        <FormLabel>Observações sobre Leitura</FormLabel>
        <Textarea
          value={readingSkills.observacoes || ''}
          onChange={(e) => updateReadingSkill('observacoes', e.target.value)}
          placeholder="Descreva outras observações sobre as habilidades de leitura do aluno..."
          rows={4}
        />
      </FormItem>
    </div>
  );
}































