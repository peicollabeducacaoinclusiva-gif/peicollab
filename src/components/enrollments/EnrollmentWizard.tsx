// ============================================================================
// COMPONENTE: EnrollmentWizard
// ============================================================================
// Wizard multi-step para processo de matrícula de alunos
// Gestão Escolar - Fase 5
// ============================================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save, Search, CheckCircle } from 'lucide-react';
import { useCreateEnrollment } from '@pei/database/hooks';
import type { Student, Enrollment } from '@pei/shared-types';

// Schema de validação
const enrollmentSchema = z.object({
  student_id: z.string().uuid('Selecione um aluno'),
  class_id: z.string().uuid('Selecione uma turma'),
  ano_letivo: z.string().min(4, 'Ano letivo inválido'),
  numero_matricula: z.string().optional(),
  data_matricula: z.string(),
  status: z.enum(['Matriculado', 'Transferido', 'Cancelado', 'Concluido']),
  
  // Dados Adicionais
  bolsista: z.boolean().optional(),
  tipo_bolsa: z.string().optional(),
  percentual_bolsa: z.number().min(0).max(100).optional(),
  
  // Transporte
  utiliza_transporte: z.boolean().optional(),
  rota_transporte: z.string().optional(),
  ponto_embarque: z.string().optional(),
  ponto_desembarque: z.string().optional(),
  
  // Material
  recebeu_material_escolar: z.boolean().optional(),
  recebeu_uniforme: z.boolean().optional(),
  
  // Observações
  observacoes: z.string().optional(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface EnrollmentWizardProps {
  schoolId: string;
  tenantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const steps = [
  { id: 1, title: 'Selecionar Aluno', icon: '🔍' },
  { id: 2, title: 'Dados da Matrícula', icon: '📝' },
  { id: 3, title: 'Benefícios', icon: '🎁' },
  { id: 4, title: 'Confirmação', icon: '✅' },
];

export function EnrollmentWizard({
  schoolId,
  tenantId,
  onSuccess,
  onCancel,
}: EnrollmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { toast } = useToast();
  const createEnrollment = useCreateEnrollment();

  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      ano_letivo: currentYear.toString(),
      data_matricula: new Date().toISOString().split('T')[0],
      status: 'Matriculado',
      bolsista: false,
      utiliza_transporte: false,
      recebeu_material_escolar: false,
      recebeu_uniforme: false,
    },
  });

  const bolsista = watch('bolsista');
  const utilizaTransporte = watch('utiliza_transporte');

  // Buscar alunos
  const searchStudents = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      toast({
        title: 'Digite algo',
        description: 'Digite pelo menos 2 caracteres para buscar',
        variant: 'destructive',
      });
      return;
    }

    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .or(`name.ilike.%${searchTerm}%,codigo_identificador.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      setStudents(data as Student[]);

      if (data.length === 0) {
        toast({
          title: 'Nenhum aluno encontrado',
          description: 'Tente outro termo de busca',
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: 'Erro ao buscar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  // Buscar turmas ao avançar para step 2
  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .eq('ano_letivo', currentYear.toString())
        .eq('status', 'Ativa')
        .order('class_name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar turmas:', error);
      toast({
        title: 'Erro ao buscar turmas',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!selectedStudent) {
        toast({
          title: 'Selecione um aluno',
          description: 'Você precisa selecionar um aluno antes de continuar',
          variant: 'destructive',
        });
        return;
      }
      setValue('student_id', selectedStudent.id);
      loadClasses();
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setValue('student_id', student.id);
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);

    try {
      const enrollmentData: any = {
        ...data,
        school_id: schoolId,
        tenant_id: tenantId,
      };

      await createEnrollment.mutateAsync(enrollmentData);

      toast({
        title: 'Matrícula realizada!',
        description: `${selectedStudent?.name} foi matriculado com sucesso.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao matricular:', error);
      toast({
        title: 'Erro ao matricular',
        description: error.message || 'Ocorreu um erro ao realizar a matrícula.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                currentStep >= step.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.icon}
            </div>
            <p
              className={`text-xs mt-1 text-center ${
                currentStep >= step.id ? 'text-green-600 font-semibold' : 'text-gray-500'
              }`}
            >
              {step.title}
            </p>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Selecionar Aluno */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">🔍 Selecionar Aluno</h3>

          <div className="flex gap-2">
            <Input
              placeholder="Digite o nome ou código do aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudents())}
            />
            <Button type="button" onClick={searchStudents} disabled={loadingStudents}>
              <Search className="h-4 w-4 mr-2" />
              {loadingStudents ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {selectedStudent && (
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{selectedStudent.name}</p>
                  {selectedStudent.codigo_identificador && (
                    <p className="text-sm text-gray-600">
                      Código: {selectedStudent.codigo_identificador}
                    </p>
                  )}
                  {selectedStudent.date_of_birth && (
                    <p className="text-sm text-gray-600">
                      Nascimento: {new Date(selectedStudent.date_of_birth).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          )}

          {students.length > 0 && !selectedStudent && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => selectStudent(student)}
                >
                  <p className="font-semibold">{student.name}</p>
                  {student.codigo_identificador && (
                    <p className="text-sm text-gray-600">Código: {student.codigo_identificador}</p>
                  )}
                  {student.date_of_birth && (
                    <p className="text-sm text-gray-600">
                      Nascimento: {new Date(student.date_of_birth).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Dados da Matrícula */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">📝 Dados da Matrícula</h3>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="font-semibold">{selectedStudent?.name}</p>
            <p className="text-sm text-gray-600">Realizando matrícula para este aluno</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ano_letivo">Ano Letivo *</Label>
              <Input
                id="ano_letivo"
                {...register('ano_letivo')}
                placeholder="2025"
              />
              {errors.ano_letivo && (
                <p className="text-sm text-red-500 mt-1">{errors.ano_letivo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="data_matricula">Data da Matrícula *</Label>
              <Input
                id="data_matricula"
                type="date"
                {...register('data_matricula')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="class_id">Turma *</Label>
            <Select onValueChange={(value) => setValue('class_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name} - {cls.education_level} {cls.grade} ({cls.shift})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class_id && (
              <p className="text-sm text-red-500 mt-1">{errors.class_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="numero_matricula">Número da Matrícula</Label>
            <Input
              id="numero_matricula"
              {...register('numero_matricula')}
              placeholder="Ex: 2025001"
            />
          </div>

          <div>
            <Label htmlFor="status">Status da Matrícula *</Label>
            <Select
              defaultValue="Matriculado"
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Matriculado">Matriculado</SelectItem>
                <SelectItem value="Transferido">Transferido</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 3: Benefícios */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-4">🎁 Benefícios e Recursos</h3>

          {/* Bolsa */}
          <div className="border-l-4 border-yellow-500 pl-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bolsista"
                checked={bolsista}
                onCheckedChange={(checked) => setValue('bolsista', checked as boolean)}
              />
              <Label htmlFor="bolsista" className="cursor-pointer font-semibold">
                Aluno é bolsista
              </Label>
            </div>

            {bolsista && (
              <>
                <div>
                  <Label htmlFor="tipo_bolsa">Tipo de Bolsa</Label>
                  <Select onValueChange={(value) => setValue('tipo_bolsa', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Integral">Integral (100%)</SelectItem>
                      <SelectItem value="Parcial">Parcial</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Merito">Mérito/Desempenho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="percentual_bolsa">Percentual da Bolsa (%)</Label>
                  <Input
                    id="percentual_bolsa"
                    type="number"
                    min="0"
                    max="100"
                    {...register('percentual_bolsa', { valueAsNumber: true })}
                    placeholder="Ex: 50"
                  />
                </div>
              </>
            )}
          </div>

          {/* Transporte */}
          <div className="border-l-4 border-blue-500 pl-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="utiliza_transporte"
                checked={utilizaTransporte}
                onCheckedChange={(checked) => setValue('utiliza_transporte', checked as boolean)}
              />
              <Label htmlFor="utiliza_transporte" className="cursor-pointer font-semibold">
                Utiliza transporte escolar
              </Label>
            </div>

            {utilizaTransporte && (
              <>
                <div>
                  <Label htmlFor="rota_transporte">Rota</Label>
                  <Input
                    id="rota_transporte"
                    {...register('rota_transporte')}
                    placeholder="Ex: Rota 1 - Centro"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ponto_embarque">Ponto de Embarque</Label>
                    <Input
                      id="ponto_embarque"
                      {...register('ponto_embarque')}
                      placeholder="Endereço ou referência"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ponto_desembarque">Ponto de Desembarque</Label>
                    <Input
                      id="ponto_desembarque"
                      {...register('ponto_desembarque')}
                      placeholder="Endereço ou referência"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Material e Uniforme */}
          <div className="border-l-4 border-green-500 pl-4 space-y-4">
            <h4 className="font-semibold">Material Escolar e Uniforme</h4>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recebeu_material_escolar"
                {...register('recebeu_material_escolar')}
              />
              <Label htmlFor="recebeu_material_escolar" className="cursor-pointer">
                Recebeu material escolar
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recebeu_uniforme"
                {...register('recebeu_uniforme')}
              />
              <Label htmlFor="recebeu_uniforme" className="cursor-pointer">
                Recebeu uniforme
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações sobre a matrícula..."
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Step 4: Confirmação */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">✅ Confirmação</h3>

          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-lg font-semibold">Pronto para matricular!</p>
                <p className="text-sm text-gray-600">Revise os dados antes de confirmar</p>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm font-semibold">Aluno:</p>
                <p className="text-sm">{selectedStudent?.name}</p>

                <p className="text-sm font-semibold">Ano Letivo:</p>
                <p className="text-sm">{watch('ano_letivo')}</p>

                <p className="text-sm font-semibold">Data Matrícula:</p>
                <p className="text-sm">
                  {watch('data_matricula') &&
                    new Date(watch('data_matricula')).toLocaleDateString('pt-BR')}
                </p>

                <p className="text-sm font-semibold">Status:</p>
                <p className="text-sm">{watch('status')}</p>
              </div>

              {bolsista && (
                <div className="border-t pt-2">
                  <p className="text-sm font-semibold text-yellow-700">
                    🎓 Bolsista ({watch('percentual_bolsa')}%)
                  </p>
                </div>
              )}

              {utilizaTransporte && (
                <div className="border-t pt-2">
                  <p className="text-sm font-semibold text-blue-700">
                    🚌 Usa transporte escolar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : prevStep}
        >
          {currentStep === 1 ? (
            'Cancelar'
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </>
          )}
        </Button>

        {currentStep < steps.length ? (
          <Button type="button" onClick={nextStep}>
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Matriculando...' : 'Confirmar Matrícula'}
          </Button>
        )}
      </div>
    </form>
  );
}

