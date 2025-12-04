// ============================================================================
// COMPONENTE: AssessmentForm
// ============================================================================
// Formulário multi-step para avaliação diagnóstica (8 etapas)
// Data: 2025-01-09
// ============================================================================

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';;
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { ASSESSMENT_STEPS } from '../../../types/assessment.types';
import type { CreateAssessmentInput } from '../../../types/assessment.types';

// Imports dos steps (serão criados)
import { IdentificationStep } from './steps/IdentificationStep';
import { LateralityStep } from './steps/LateralityStep';
import { OrientationStep } from './steps/OrientationStep';
import { PerceptionStep } from './steps/PerceptionStep';
import { ExpressionStep } from './steps/ExpressionStep';
import { ReadingStep } from './steps/ReadingStep';
import { ReasoningStep } from './steps/ReasoningStep';
import { RelationsStep } from './steps/RelationsStep';
import { SummaryStep } from './steps/SummaryStep';

// ============================================================================
// PROPS
// ============================================================================

interface AssessmentFormProps {
  studentId: string;
  studentName: string;
  planId?: string;
  onSubmit: (data: CreateAssessmentInput) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// COMPONENTES DOS STEPS
// ============================================================================

const STEP_COMPONENTS = [
  IdentificationStep,
  LateralityStep,
  OrientationStep,
  PerceptionStep,
  ExpressionStep,
  ReadingStep,
  ReasoningStep,
  RelationsStep,
  SummaryStep,
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function AssessmentForm({
  studentId,
  studentName,
  planId,
  onSubmit,
  onCancel,
}: AssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<CreateAssessmentInput>({
    defaultValues: {
      student_id: studentId,
      assessment_date: new Date().toISOString().split('T')[0],
      assessment_type: 'inicial',
      plan_id: planId,
      laterality: {},
      spatial_orientation: {},
      temporal_orientation: {},
      visual_perception: {},
      auditory_perception: {},
      oral_expression: {},
      written_expression: {},
      reading_skills: {},
      logical_reasoning: {},
      motor_coordination: {},
      interpersonal_relations: {},
      student_skills: { pontos_fortes: [], areas_melhorar: [], interesses: [] },
      professional_support: [],
      participants: [],
    },
  });

  const CurrentStepComponent = STEP_COMPONENTS[currentStep];
  const currentStepInfo = ASSESSMENT_STEPS[currentStep];
  const totalSteps = ASSESSMENT_STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Navegar para próximo step
  const handleNext = async () => {
    // Validar campos do step atual
    const isValid = await methods.trigger();
    
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep((curr) => curr + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Voltar para step anterior
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((curr) => curr - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submeter formulário
  const handleSubmit = methods.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Header com progresso */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Avaliação Diagnóstica</h2>
              <p className="text-muted-foreground">Aluno: {studentName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Etapa {currentStep + 1} de {totalSteps}
              </p>
              <p className="text-2xl font-bold text-primary">{Math.round(progress)}%</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {ASSESSMENT_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center min-w-[100px] ${
                index === currentStep
                  ? 'text-primary'
                  : index < currentStep
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                  index === currentStep
                    ? 'bg-primary text-white'
                    : index < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <p className="text-xs text-center font-medium">{step.title}</p>
            </div>
          ))}
        </div>

        {/* Current Step Form */}
        <Card>
          <CardHeader>
            <CardTitle>{currentStepInfo.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? onCancel : handlePrevious}
              disabled={isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStep === 0 ? 'Cancelar' : 'Anterior'}
            </Button>

            {currentStep < totalSteps - 1 ? (
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Finalizar Avaliação'}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Info de salvamento automático */}
        <p className="text-xs text-center text-muted-foreground">
          💾 Seu progresso é salvo automaticamente a cada etapa
        </p>
      </div>
    </FormProvider>
  );
}































