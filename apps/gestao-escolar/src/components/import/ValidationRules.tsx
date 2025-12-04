import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@pei/ui';
import { Button } from '@pei/ui';
import { Switch } from '@pei/ui';
import { Label } from '@pei/ui';
import { Badge } from '@pei/ui';
import { Plus, Trash2, AlertTriangle, Info, XCircle, ArrowRight } from 'lucide-react';
import { studentSchema, professionalSchema } from '../../lib/validationSchemas';
import { z } from 'zod';

interface ValidationRulesProps {
  recordType: 'student' | 'professional';
  mappedFields: string[];
  onRulesConfigured: () => void;
}

/**
 * Extrai informações de validação de um schema Zod
 */
function extractSchemaValidations(schema: z.ZodObject<any>): Array<{
  field: string;
  type: string;
  severity: 'error' | 'warning';
  message: string;
}> {
  const validations: Array<{
    field: string;
    type: string;
    severity: 'error' | 'warning';
    message: string;
  }> = [];

  const shape = schema.shape;
  if (!shape) return validations;

  Object.entries(shape).forEach(([fieldName, fieldSchema]: [string, any]) => {
    if (fieldSchema && typeof fieldSchema === 'object') {
      // Verificar se é obrigatório
      if (fieldSchema._def?.typeName === 'ZodOptional' || fieldSchema._def?.typeName === 'ZodDefault') {
        // Campo opcional - tratar como warning
        const innerType = fieldSchema._def?.innerType || fieldSchema._def?.type;
        if (innerType) {
          const type = getFieldType(innerType);
          if (type) {
            validations.push({
              field: fieldName,
              type,
              severity: 'warning',
              message: getValidationMessage(fieldName, type, false),
            });
          }
        }
      } else {
        // Campo obrigatório - tratar como error
        const type = getFieldType(fieldSchema);
        if (type) {
          validations.push({
            field: fieldName,
            type,
            severity: 'error',
            message: getValidationMessage(fieldName, type, true),
          });
        }
      }
    }
  });

  return validations;
}

function getFieldType(schema: any): string | null {
  if (!schema || !schema._def) return null;
  
  const typeName = schema._def.typeName;
  
  if (typeName === 'ZodString') {
    // Verificar refinements para tipos específicos
    const checks = schema._def.checks || [];
    for (const check of checks) {
      if (check.kind === 'email') return 'email';
    }
    // Verificar se tem refine para CPF, telefone, etc.
    if (schema._def.checks?.some((c: any) => c.kind === 'refine')) {
      // Tentar inferir do nome do campo ou mensagem
      return 'custom';
    }
    return 'string';
  }
  
  if (typeName === 'ZodNumber') return 'number';
  if (typeName === 'ZodBoolean') return 'boolean';
  if (typeName === 'ZodDate') return 'date';
  if (typeName === 'ZodArray') return 'array';
  
  return 'unknown';
}

function getValidationMessage(fieldName: string, type: string, required: boolean): string {
  const fieldLabels: Record<string, string> = {
    name: 'Nome',
    full_name: 'Nome completo',
    cpf: 'CPF',
    email: 'Email',
    phone: 'Telefone',
    date_of_birth: 'Data de nascimento',
    guardian_phone: 'Telefone do responsável',
    guardian_email: 'Email do responsável',
  };

  const label = fieldLabels[fieldName] || fieldName;
  
  if (required) {
    return `${label} é obrigatório`;
  }
  
  switch (type) {
    case 'email':
      return `${label} deve ser um email válido`;
    case 'cpf':
      return `${label} deve ser um CPF válido`;
    case 'phone':
      return `${label} deve ser um telefone válido`;
    default:
      return `${label} inválido`;
  }
}

export function ValidationRules({ recordType, mappedFields, onRulesConfigured }: ValidationRulesProps) {
  const [rules, setRules] = useState<Array<{
    field: string;
    type: string;
    severity: 'error' | 'warning';
    message: string;
  }>>([]);
  const [useDefaults, setUseDefaults] = useState(true);

  useEffect(() => {
    // Extrair validações do schema Zod baseado no tipo de registro
    const schema = recordType === 'student' ? studentSchema : professionalSchema;
    const allValidations = extractSchemaValidations(schema);
    
    // Filtrar apenas validações para campos que foram mapeados
    const applicableRules = allValidations.filter(rule => 
      mappedFields.includes(rule.field)
    );
    
    if (useDefaults) {
      setRules(applicableRules);
    } else {
      setRules([]);
    }
  }, [recordType, mappedFields, useDefaults]);

  const toggleRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    setRules(newRules);
  };

  const addCustomRule = () => {
    const newRule = {
      field: mappedFields[0] || '',
      type: 'required',
      severity: 'error' as const,
      message: 'Erro de validação'
    };
    setRules([...rules, newRule]);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with defaults toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regras de Validação</CardTitle>
              <CardDescription>
                Configure as validações que serão aplicadas aos dados importados.
                As validações são baseadas em schemas Zod para garantir consistência.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={useDefaults}
                onCheckedChange={setUseDefaults}
                id="use-defaults"
              />
              <Label htmlFor="use-defaults" className="cursor-pointer">
                Usar validações padrão
              </Label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Regras Ativas ({rules.length})
            </CardTitle>
            <Button onClick={addCustomRule} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma regra de validação configurada</p>
              <p className="text-xs mt-1">
                Ative as validações padrão ou adicione regras personalizadas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  {/* Ícone de severidade */}
                  <div>
                    {getSeverityIcon(rule.severity)}
                  </div>
                  
                  {/* Campo */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {rule.field}
                      </p>
                      <Badge variant={getSeverityColor(rule.severity) as any}>
                        {rule.severity}
                      </Badge>
                      <Badge variant="outline">
                        {rule.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rule.message}
                    </p>
                  </div>
                  
                  {/* Ações */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRule(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">
            {rules.filter(r => r.severity === 'error').length} regras bloqueantes,{' '}
            {rules.filter(r => r.severity === 'warning').length} avisos
          </p>
          <p className="text-xs text-muted-foreground">
            Registros com erros bloqueantes não serão importados.
            As validações são executadas usando schemas Zod para garantir type-safety.
          </p>
        </div>
        <Button onClick={onRulesConfigured}>
          Aplicar Validações
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
