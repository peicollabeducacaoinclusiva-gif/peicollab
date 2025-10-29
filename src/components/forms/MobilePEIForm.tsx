import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  BookOpen, 
  Target, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Save,
  Upload,
  AlertCircle
} from 'lucide-react';
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard } from '@/components/shared/ResponsiveLayout';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface MobilePEIFormProps {
  studentId?: string;
  peiId?: string;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function MobilePEIForm({ studentId, peiId, onSave, onCancel }: MobilePEIFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    student: {
      name: '',
      dateOfBirth: '',
      grade: '',
      school: ''
    },
    diagnosis: {
      barriers: [],
      strengths: [],
      needs: []
    },
    planning: {
      goals: [],
      strategies: [],
      resources: []
    },
    evaluation: {
      progress: '',
      observations: '',
      nextSteps: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const { pendingChanges } = useOfflineSync();

  const steps = [
    { id: 1, title: 'Identificação', icon: User, description: 'Dados do aluno' },
    { id: 2, title: 'Diagnóstico', icon: BookOpen, description: 'Avaliação inicial' },
    { id: 3, title: 'Planejamento', icon: Target, description: 'Metas e estratégias' },
    { id: 4, title: 'Avaliação', icon: CheckCircle, description: 'Acompanhamento' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave?.(formData);
    } catch (error) {
      console.error('Erro ao salvar PEI:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ResponsiveCard className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Nome do Aluno</Label>
              <Input
                id="studentName"
                value={formData.student.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  student: { ...prev.student, name: e.target.value }
                }))}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.student.dateOfBirth}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  student: { ...prev.student, dateOfBirth: e.target.value }
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grade">Série/Ano</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Ano</SelectItem>
                  <SelectItem value="2">2º Ano</SelectItem>
                  <SelectItem value="3">3º Ano</SelectItem>
                  <SelectItem value="4">4º Ano</SelectItem>
                  <SelectItem value="5">5º Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ResponsiveCard>
        );

      case 2:
        return (
          <ResponsiveCard className="space-y-4">
            <div className="space-y-2">
              <Label>Barreiras Identificadas</Label>
              <Textarea
                placeholder="Descreva as principais barreiras de aprendizagem identificadas..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Pontos Fortes</Label>
              <Textarea
                placeholder="Descreva os pontos fortes e habilidades do aluno..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Necessidades Específicas</Label>
              <Textarea
                placeholder="Descreva as necessidades específicas de apoio..."
                className="min-h-[100px]"
              />
            </div>
          </ResponsiveCard>
        );

      case 3:
        return (
          <ResponsiveCard className="space-y-4">
            <div className="space-y-2">
              <Label>Metas Educacionais</Label>
              <Textarea
                placeholder="Defina as metas específicas e mensuráveis para o aluno..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Estratégias de Ensino</Label>
              <Textarea
                placeholder="Descreva as estratégias e metodologias que serão utilizadas..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Recursos Necessários</Label>
              <Textarea
                placeholder="Liste os recursos materiais e humanos necessários..."
                className="min-h-[100px]"
              />
            </div>
          </ResponsiveCard>
        );

      case 4:
        return (
          <ResponsiveCard className="space-y-4">
            <div className="space-y-2">
              <Label>Progresso Atual</Label>
              <Textarea
                placeholder="Descreva o progresso observado até o momento..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Registre observações importantes sobre o desenvolvimento..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Próximos Passos</Label>
              <Textarea
                placeholder="Defina os próximos passos e ajustes necessários..."
                className="min-h-[100px]"
              />
            </div>
          </ResponsiveCard>
        );

      default:
        return null;
    }
  };

  return (
    <ResponsiveLayout className="max-w-4xl mx-auto">
      {/* Header com progresso */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Criar PEI</h1>
            <p className="text-muted-foreground">
              Passo {currentStep} de {steps.length}: {steps[currentStep - 1]?.description}
            </p>
          </div>
          {pendingChanges > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {pendingChanges} pendente{pendingChanges > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Navegação por abas (mobile) */}
      <div className="lg:hidden">
        <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
          <TabsList className="grid w-full grid-cols-4">
            {steps.map((step) => (
              <TabsTrigger key={step.id} value={step.id.toString()} className="flex flex-col gap-1 h-auto py-2">
                <step.icon className="h-4 w-4" />
                <span className="text-xs">{step.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo do formulário */}
      <div className="space-y-6">
        {renderStepContent()}

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < steps.length ? (
              <Button onClick={handleNext} className="flex items-center gap-2">
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar PEI'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}


