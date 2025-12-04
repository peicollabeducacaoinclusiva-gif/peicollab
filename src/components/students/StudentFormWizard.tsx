// ============================================================================
// COMPONENTE: StudentFormWizard
// ============================================================================
// Formulário multi-step completo para cadastro/edição de alunos
// Gestão Escolar - Fase 4
// ============================================================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import type { Student } from '@pei/shared-types';

// Schema de validação
const studentSchema = z.object({
  // Dados Básicos
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  nome_social: z.string().optional(),
  date_of_birth: z.string().optional(),
  codigo_identificador: z.string().optional(),
  numero_ficha: z.string().optional(),
  
  // Documentos
  cpf: z.string().optional(),
  rg: z.string().optional(),
  certidao_nascimento: z.string().optional(),
  numero_nis: z.string().optional(),
  numero_sus: z.string().optional(),
  
  // Endereço
  logradouro: z.string().optional(),
  numero_endereco: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  
  // Contato
  telefone_residencial: z.string().optional(),
  telefone_celular: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Responsável 1
  responsavel1_nome: z.string().optional(),
  responsavel1_cpf: z.string().optional(),
  responsavel1_telefone: z.string().optional(),
  responsavel1_parentesco: z.string().optional(),
  
  // Responsável 2
  responsavel2_nome: z.string().optional(),
  responsavel2_cpf: z.string().optional(),
  responsavel2_telefone: z.string().optional(),
  responsavel2_parentesco: z.string().optional(),
  
  // Necessidades Especiais
  necessidades_especiais: z.boolean().optional(),
  tipo_necessidade: z.array(z.string()).optional(),
  cid_diagnostico: z.string().optional(),
  descricao_diagnostico: z.string().optional(),
  medicacao_continua: z.boolean().optional(),
  medicacao_detalhes: z.string().optional(),
  
  // Matrícula e Status
  status_matricula: z.string().optional(),
  numero_matricula: z.string().optional(),
  data_matricula: z.string().optional(),
  
  // Transporte
  usa_transporte_escolar: z.boolean().optional(),
  rota_transporte: z.string().optional(),
  
  // Observações
  observacoes_gerais: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormWizardProps {
  student?: any; // Student existente para edição
  tenantId?: string;
  schoolId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const steps = [
  { id: 1, title: 'Dados Básicos', icon: '👤' },
  { id: 2, title: 'Documentos', icon: '📄' },
  { id: 3, title: 'Endereço e Contato', icon: '📍' },
  { id: 4, title: 'Responsáveis', icon: '👨‍👩‍👧' },
  { id: 5, title: 'Saúde e NEE', icon: '🏥' },
  { id: 6, title: 'Matrícula e Transporte', icon: '🚌' },
];

export function StudentFormWizard({
  student,
  tenantId,
  schoolId,
  onSuccess,
  onCancel,
}: StudentFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student ? {
      name: student.name || '',
      nome_social: student.nome_social || '',
      date_of_birth: student.date_of_birth || '',
      codigo_identificador: student.codigo_identificador || '',
      cpf: student.cpf || '',
      rg: student.rg || '',
      logradouro: student.logradouro || '',
      cidade: student.cidade || '',
      estado: student.estado || '',
      cep: student.cep || '',
      telefone_celular: student.telefone_celular || '',
      email: student.email || '',
      necessidades_especiais: student.necessidades_especiais || false,
      tipo_necessidade: student.tipo_necessidade || [],
      status_matricula: student.status_matricula || 'Ativo',
    } : {
      status_matricula: 'Ativo',
      necessidades_especiais: false,
      medicacao_continua: false,
      usa_transporte_escolar: false,
    },
  });

  const necessidadesEspeciais = watch('necessidades_especiais');
  const medicacaoContinua = watch('medicacao_continua');
  const usaTransporte = watch('usa_transporte_escolar');

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    
    try {
      const studentData: any = {
        ...data,
        tenant_id: tenantId,
        school_id: schoolId,
        is_active: true,
      };

      // Se não tem tenantId, buscar da escola
      if (!tenantId && schoolId) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('tenant_id')
          .eq('id', schoolId)
          .single();
        
        if (schoolData?.tenant_id) {
          studentData.tenant_id = schoolData.tenant_id;
        }
      }

      if (student) {
        // Atualizar
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', student.id);
        
        if (error) throw error;
        
        toast({
          title: 'Aluno atualizado!',
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        // Criar
        const { error } = await supabase
          .from('students')
          .insert(studentData);
        
        if (error) throw error;
        
        toast({
          title: 'Aluno cadastrado!',
          description: `${data.name} foi cadastrado com sucesso.`,
        });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar aluno:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o aluno.',
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
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                currentStep >= step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.icon}
            </div>
            <p className={`text-xs mt-1 hidden sm:block ${
              currentStep >= step.id ? 'text-blue-600 font-semibold' : 'text-gray-500'
            }`}>
              {step.title}
            </p>
            {index < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 ${
                currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Dados Básicos */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">👤 Dados Básicos</h3>
          
          <div>
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nome completo do aluno"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nome_social">Nome Social</Label>
            <Input
              id="nome_social"
              {...register('nome_social')}
              placeholder="Nome social (se houver)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Data de Nascimento</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
              />
            </div>

            <div>
              <Label htmlFor="codigo_identificador">Código do Aluno</Label>
              <Input
                id="codigo_identificador"
                {...register('codigo_identificador')}
                placeholder="Ex: ALU2025001"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="numero_ficha">Número da Ficha</Label>
            <Input
              id="numero_ficha"
              {...register('numero_ficha')}
              placeholder="Número da ficha física"
            />
          </div>
        </div>
      )}

      {/* Step 2: Documentos */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">📄 Documentos</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register('cpf')}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                {...register('rg')}
                placeholder="00.000.000-0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="certidao_nascimento">Certidão de Nascimento</Label>
            <Input
              id="certidao_nascimento"
              {...register('certidao_nascimento')}
              placeholder="Número da certidão"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_nis">Número NIS</Label>
              <Input
                id="numero_nis"
                {...register('numero_nis')}
                placeholder="Número do NIS"
              />
            </div>

            <div>
              <Label htmlFor="numero_sus">Cartão SUS</Label>
              <Input
                id="numero_sus"
                {...register('numero_sus')}
                placeholder="Número do cartão SUS"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Endereço e Contato */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">📍 Endereço e Contato</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                {...register('logradouro')}
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div>
              <Label htmlFor="numero_endereco">Número</Label>
              <Input
                id="numero_endereco"
                {...register('numero_endereco')}
                placeholder="Nº"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                {...register('complemento')}
                placeholder="Apto, Bloco, etc."
              />
            </div>

            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                {...register('bairro')}
                placeholder="Bairro"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                {...register('cidade')}
                placeholder="Cidade"
              />
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select onValueChange={(value) => setValue('estado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                {...register('cep')}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <Label htmlFor="telefone_residencial">Telefone Residencial</Label>
              <Input
                id="telefone_residencial"
                type="tel"
                {...register('telefone_residencial')}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div>
              <Label htmlFor="telefone_celular">Telefone Celular</Label>
              <Input
                id="telefone_celular"
                type="tel"
                {...register('telefone_celular')}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Responsáveis */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-4">👨‍👩‍👧 Responsáveis</h3>
          
          {/* Responsável 1 */}
          <div className="border-l-4 border-blue-500 pl-4 space-y-4">
            <h4 className="font-semibold">Responsável Principal</h4>
            
            <div>
              <Label htmlFor="responsavel1_nome">Nome Completo</Label>
              <Input
                id="responsavel1_nome"
                {...register('responsavel1_nome')}
                placeholder="Nome do responsável"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsavel1_cpf">CPF</Label>
                <Input
                  id="responsavel1_cpf"
                  {...register('responsavel1_cpf')}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <Label htmlFor="responsavel1_telefone">Telefone</Label>
                <Input
                  id="responsavel1_telefone"
                  {...register('responsavel1_telefone')}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="responsavel1_parentesco">Parentesco</Label>
              <Select onValueChange={(value) => setValue('responsavel1_parentesco', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pai">Pai</SelectItem>
                  <SelectItem value="Mãe">Mãe</SelectItem>
                  <SelectItem value="Avô">Avô</SelectItem>
                  <SelectItem value="Avó">Avó</SelectItem>
                  <SelectItem value="Tio">Tio</SelectItem>
                  <SelectItem value="Tia">Tia</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável 2 */}
          <div className="border-l-4 border-gray-400 pl-4 space-y-4">
            <h4 className="font-semibold">Responsável Secundário (Opcional)</h4>
            
            <div>
              <Label htmlFor="responsavel2_nome">Nome Completo</Label>
              <Input
                id="responsavel2_nome"
                {...register('responsavel2_nome')}
                placeholder="Nome do responsável"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsavel2_cpf">CPF</Label>
                <Input
                  id="responsavel2_cpf"
                  {...register('responsavel2_cpf')}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <Label htmlFor="responsavel2_telefone">Telefone</Label>
                <Input
                  id="responsavel2_telefone"
                  {...register('responsavel2_telefone')}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="responsavel2_parentesco">Parentesco</Label>
              <Select onValueChange={(value) => setValue('responsavel2_parentesco', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pai">Pai</SelectItem>
                  <SelectItem value="Mãe">Mãe</SelectItem>
                  <SelectItem value="Avô">Avô</SelectItem>
                  <SelectItem value="Avó">Avó</SelectItem>
                  <SelectItem value="Tio">Tio</SelectItem>
                  <SelectItem value="Tia">Tia</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Saúde e NEE */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">🏥 Saúde e Necessidades Especiais</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="necessidades_especiais"
              checked={necessidadesEspeciais}
              onCheckedChange={(checked) => setValue('necessidades_especiais', checked as boolean)}
            />
            <Label htmlFor="necessidades_especiais" className="cursor-pointer">
              Aluno possui Necessidades Educacionais Especiais (NEE)
            </Label>
          </div>

          {necessidadesEspeciais && (
            <div className="space-y-4 border-l-4 border-blue-500 pl-4 mt-4">
              <div>
                <Label htmlFor="cid_diagnostico">CID / Diagnóstico</Label>
                <Input
                  id="cid_diagnostico"
                  {...register('cid_diagnostico')}
                  placeholder="Ex: F84.0 - Autismo Infantil"
                />
              </div>

              <div>
                <Label htmlFor="descricao_diagnostico">Descrição do Diagnóstico</Label>
                <Textarea
                  id="descricao_diagnostico"
                  {...register('descricao_diagnostico')}
                  placeholder="Descreva o diagnóstico e características observadas..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="medicacao_continua"
              checked={medicacaoContinua}
              onCheckedChange={(checked) => setValue('medicacao_continua', checked as boolean)}
            />
            <Label htmlFor="medicacao_continua" className="cursor-pointer">
              Usa medicação contínua
            </Label>
          </div>

          {medicacaoContinua && (
            <div className="border-l-4 border-orange-500 pl-4">
              <Label htmlFor="medicacao_detalhes">Detalhes da Medicação</Label>
              <Textarea
                id="medicacao_detalhes"
                {...register('medicacao_detalhes')}
                placeholder="Liste os medicamentos, dosagens e horários..."
                rows={3}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 6: Matrícula e Transporte */}
      {currentStep === 6 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">🚌 Matrícula e Transporte</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status_matricula">Status da Matrícula</Label>
              <Select 
                defaultValue="Ativo"
                onValueChange={(value) => setValue('status_matricula', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Transferido">Transferido</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Evadido">Evadido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numero_matricula">Número da Matrícula</Label>
              <Input
                id="numero_matricula"
                {...register('numero_matricula')}
                placeholder="Ex: 2025001"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="data_matricula">Data da Matrícula</Label>
            <Input
              id="data_matricula"
              type="date"
              {...register('data_matricula')}
            />
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="usa_transporte_escolar"
              checked={usaTransporte}
              onCheckedChange={(checked) => setValue('usa_transporte_escolar', checked as boolean)}
            />
            <Label htmlFor="usa_transporte_escolar" className="cursor-pointer">
              Usa transporte escolar
            </Label>
          </div>

          {usaTransporte && (
            <div className="border-l-4 border-green-500 pl-4">
              <Label htmlFor="rota_transporte">Rota do Transporte</Label>
              <Input
                id="rota_transporte"
                {...register('rota_transporte')}
                placeholder="Ex: Rota 1 - Bairro Centro"
              />
            </div>
          )}

          <div className="mt-6">
            <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
            <Textarea
              id="observacoes_gerais"
              {...register('observacoes_gerais')}
              placeholder="Observações adicionais sobre o aluno..."
              rows={4}
            />
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
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : student ? 'Atualizar' : 'Cadastrar'}
          </Button>
        )}
      </div>
    </form>
  );
}

