import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Save, ArrowRight, Check, X } from 'lucide-react';
import { supabase } from '@pei/database';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  targetTable: string;
  transform?: string;
  required: boolean;
}

interface FieldMapperProps {
  sourceFields: string[];
  recordType: 'student' | 'professional' | 'user';
  onMappingComplete: (mappings: FieldMapping[]) => void;
  initialMappings?: FieldMapping[];
}

export function FieldMapper({ 
  sourceFields, 
  recordType, 
  onMappingComplete,
  initialMappings = []
}: FieldMapperProps) {
  const [mappings, setMappings] = useState<Record<string, FieldMapping>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [configName, setConfigName] = useState('');

  useEffect(() => {
    loadTemplates();
    initializeMappings();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('import_configs')
      .select('id, name, description, field_mappings')
      .eq('is_active', true)
      .order('name');
    
    setTemplates(data || []);
  };

  const initializeMappings = () => {
    const initial: Record<string, FieldMapping> = {};
    
    sourceFields.forEach(sourceField => {
      const existing = initialMappings.find(m => m.sourceField === sourceField);
      
      if (existing) {
        initial[sourceField] = existing;
      } else {
        // Auto-mapear campos comuns
        const autoMapped = autoMapField(sourceField, recordType);
        initial[sourceField] = {
          sourceField,
          targetField: autoMapped.targetField || '',
          targetTable: autoMapped.targetTable || getMainTable(recordType),
          transform: autoMapped.transform,
          required: false
        };
      }
    });
    
    setMappings(initial);
  };

  const autoMapField = (sourceField: string, type: 'student' | 'professional' | 'user'): Partial<FieldMapping> => {
    const normalizedSource = sourceField.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Mapeamentos comuns para alunos
    if (type === 'student') {
      if (normalizedSource.includes('matricula')) return { targetField: 'registration_number', targetTable: 'students' };
      if (normalizedSource.includes('aluno') || normalizedSource.includes('nome')) return { targetField: 'name', targetTable: 'students' };
      if (normalizedSource.includes('cpf')) return { targetField: 'cpf', targetTable: 'students', transform: 'cpf_format' };
      if (normalizedSource.includes('nascimento')) return { targetField: 'date_of_birth', targetTable: 'students', transform: 'date_br_to_iso' };
      if (normalizedSource.includes('turma')) return { targetField: 'class_name', targetTable: 'student_enrollments' };
      if (normalizedSource.includes('serie') || normalizedSource.includes('ano')) return { targetField: 'grade', targetTable: 'student_enrollments' };
      if (normalizedSource.includes('inep')) return { targetField: 'student_id', targetTable: 'students' };
      if (normalizedSource.includes('bolsa')) return { targetField: 'numero_bolsa_familia', targetTable: 'students' };
      if (normalizedSource.includes('responsavel')) return { targetField: 'guardian_name', targetTable: 'students' };
    }
    
    // Mapeamentos comuns para profissionais
    if (type === 'professional') {
      if (normalizedSource.includes('codigo')) return { targetField: 'registration_number', targetTable: 'professionals' };
      if (normalizedSource.includes('nome')) return { targetField: 'full_name', targetTable: 'professionals' };
      if (normalizedSource.includes('funcao') || normalizedSource.includes('cargo')) return { targetField: 'professional_role', targetTable: 'professionals' };
      if (normalizedSource.includes('cpf')) return { targetField: 'cpf', targetTable: 'professionals', transform: 'cpf_format' };
      if (normalizedSource.includes('admissao')) return { targetField: 'hire_date', targetTable: 'professionals', transform: 'date_br_to_iso' };
      if (normalizedSource.includes('demissao')) return { targetField: 'termination_date', targetTable: 'professionals', transform: 'date_br_to_iso' };
    }
    
    return { targetField: '', targetTable: getMainTable(type as 'student' | 'professional' | 'user') };
  };

  const getMainTable = (type: 'student' | 'professional' | 'user'): string => {
    const tables: Record<'student' | 'professional' | 'user', string> = {
      'student': 'students',
      'professional': 'professionals',
      'user': 'profiles'
    };
    return tables[type] || 'students';
  };

  const getTargetFields = (type: string): Array<{ value: string; label: string; table: string }> => {
    if (type === 'student') {
      return [
        { value: '', label: '-- Não mapear --', table: 'students' },
        { value: 'name', label: 'Nome do Aluno', table: 'students' },
        { value: 'registration_number', label: 'Número de Matrícula', table: 'students' },
        { value: 'codigo_identificador', label: 'Código Identificador', table: 'students' },
        { value: 'cpf', label: 'CPF', table: 'students' },
        { value: 'date_of_birth', label: 'Data de Nascimento', table: 'students' },
        { value: 'student_id', label: 'Código INEP', table: 'students' },
        { value: 'guardian_name', label: 'Nome do Responsável', table: 'students' },
        { value: 'guardian_phone', label: 'Telefone do Responsável', table: 'students' },
        { value: 'numero_bolsa_familia', label: 'Número Bolsa Família', table: 'students' },
        { value: 'status_matricula', label: 'Situação Acadêmica', table: 'students' },
        { value: 'class_name', label: 'Turma', table: 'student_enrollments' },
        { value: 'grade', label: 'Série/Ano', table: 'student_enrollments' },
        { value: 'academic_year', label: 'Ano Letivo', table: 'student_enrollments' },
      ];
    }
    
    if (type === 'professional') {
      return [
        { value: '', label: '-- Não mapear --', table: 'professionals' },
        { value: 'full_name', label: 'Nome Completo', table: 'professionals' },
        { value: 'registration_number', label: 'Código/Matrícula', table: 'professionals' },
        { value: 'cpf', label: 'CPF', table: 'professionals' },
        { value: 'email', label: 'Email', table: 'professionals' },
        { value: 'phone', label: 'Telefone', table: 'professionals' },
        { value: 'professional_role', label: 'Função/Cargo', table: 'professionals' },
        { value: 'hire_date', label: 'Data de Admissão', table: 'professionals' },
        { value: 'termination_date', label: 'Data de Demissão', table: 'professionals' },
        { value: 'specialization', label: 'Especialização', table: 'professionals' },
      ];
    }
    
    return [];
  };

  const updateMapping = (sourceField: string, updates: Partial<FieldMapping>) => {
    setMappings(prev => {
      const current = prev[sourceField];
      const updated: FieldMapping = {
        sourceField: current?.sourceField || sourceField,
        targetField: updates.targetField ?? current?.targetField ?? '',
        targetTable: updates.targetTable ?? current?.targetTable ?? '',
        transform: updates.transform ?? current?.transform,
        required: updates.required ?? current?.required ?? false,
      };
      return {
        ...prev,
        [sourceField]: updated,
      };
    });
  };

  const handleComplete = () => {
    const mappingsList = Object.values(mappings).filter(m => m.targetField !== '');
    onMappingComplete(mappingsList);
  };

  const loadTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const templateMappings: Record<string, FieldMapping> = {};
    const fieldMappings = template.field_mappings || {};
    
    sourceFields.forEach(sourceField => {
      const mapped = fieldMappings[sourceField];
      if (mapped) {
        templateMappings[sourceField] = {
          sourceField,
          targetField: mapped.target,
          targetTable: mapped.table || getMainTable(recordType),
          transform: mapped.transform,
          required: mapped.required || false
        };
      }
    });
    
    setMappings(templateMappings);
  };

  const saveAsTemplate = async () => {
    if (!configName.trim()) {
      alert('Digite um nome para salvar a configuração');
      return;
    }
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        throw new Error('Usuário não autenticado');
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.user.id)
        .single();
      
      const fieldMappingsObj: Record<string, any> = {};
      Object.values(mappings).forEach(m => {
        if (m.targetField) {
          fieldMappingsObj[m.sourceField] = {
            target: m.targetField,
            table: m.targetTable,
            transform: m.transform,
            required: m.required
          };
        }
      });
      
      const { error } = await supabase.from('import_configs').insert({
        name: configName,
        source_system: 'custom',
        file_format: 'csv',
        field_mappings: fieldMappingsObj,
        tenant_id: profile?.tenant_id,
        created_by: user.user?.id
      });
      
      if (error) throw error;
      
      alert('Configuração salva com sucesso!');
      loadTemplates();
      setConfigName('');
    } catch (error: any) {
      alert('Erro ao salvar configuração: ' + error.message);
    }
  };

  const targetFieldOptions = getTargetFields(recordType);
  const mappedCount = Object.values(mappings).filter(m => m.targetField !== '').length;
  const unmappedCount = sourceFields.length - mappedCount;

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Mapeamento</CardTitle>
          <CardDescription>
            Use um template salvo ou configure manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Selecionar Template</Label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  if (e.target.value) loadTemplate(e.target.value);
                }}
                className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">-- Configurar manualmente --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Salvar como Template</Label>
              <Input
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Nome da configuração"
                className="mt-2"
              />
            </div>
            <Button
              onClick={saveAsTemplate}
              disabled={!configName.trim()}
              variant="outline"
              className="mt-7"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Status */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">
            {mappedCount} campos mapeados, {unmappedCount} não mapeados
          </p>
          <p className="text-xs text-muted-foreground">
            Mapeie pelo menos os campos obrigatórios antes de continuar
          </p>
        </div>
        <Button onClick={handleComplete} disabled={mappedCount === 0}>
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Field Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de Campos</CardTitle>
          <CardDescription>
            Relacione os campos do arquivo com os campos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sourceFields.map(sourceField => {
              const mapping = mappings[sourceField];
              if (!mapping) return null;
              
              const isMapped = mapping.targetField && mapping.targetField !== '';
              
              return (
                <div key={sourceField} className="grid grid-cols-12 gap-4 items-center p-3 border border-border rounded-lg">
                  {/* Campo de Origem */}
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-foreground">
                      {sourceField}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Origem
                    </p>
                  </div>
                  
                  {/* Seta */}
                  <div className="col-span-1 flex justify-center">
                    <ArrowRight className={`h-4 w-4 ${isMapped ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  
                  {/* Campo de Destino */}
                  <div className="col-span-4">
                    <select
                      value={mapping.targetField || ''}
                      onChange={(e) => {
                        const selected = targetFieldOptions.find(opt => opt.value === e.target.value);
                        updateMapping(sourceField, {
                          targetField: e.target.value,
                          targetTable: selected?.table || getMainTable(recordType)
                        });
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                    >
                      {targetFieldOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Transformação */}
                  <div className="col-span-3">
                    <select
                      value={mapping.transform || ''}
                      onChange={(e) => updateMapping(sourceField, { transform: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                      disabled={!isMapped}
                    >
                      <option value="">Sem transformação</option>
                      <option value="uppercase">MAIÚSCULAS</option>
                      <option value="lowercase">minúsculas</option>
                      <option value="trim">Remover espaços</option>
                      <option value="cpf_format">Formatar CPF</option>
                      <option value="phone_format">Formatar Telefone</option>
                      <option value="date_br_to_iso">Data BR → ISO</option>
                    </select>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-1 flex justify-center">
                    {isMapped ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


