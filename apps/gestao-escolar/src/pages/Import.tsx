import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Settings, CheckCircle, Play, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ThemeToggle } from '../components/ThemeToggle';
import { FileUploader } from '../components/import/FileUploader';
import { FieldMapper } from '../components/import/FieldMapper';
import { ValidationRules } from '../components/import/ValidationRules';
import { DuplicateResolver } from '../components/import/DuplicateResolver';
import { ImportProgress } from '../components/import/ImportProgress';
import { ParsedData, findDuplicates, createImportBatch } from '../services/importService';
import { 
  validateRecordWithSchema, 
  importRecordSchema, 
  studentSchema, 
  professionalSchema 
} from '../lib/validationSchemas';

const STEPS = [
  { id: 1, name: 'Upload', icon: Upload },
  { id: 2, name: 'Mapeamento', icon: Settings },
  { id: 3, name: 'Validação', icon: CheckCircle },
  { id: 4, name: 'Duplicados', icon: CheckCircle },
  { id: 5, name: 'Importação', icon: Play }
];

export default function Import() {
  const [currentStep, setCurrentStep] = useState(1);
  const [recordType, setRecordType] = useState<'student' | 'professional'>('student');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Array<{ row: number; errors: Array<{ field: string; message: string }> }>>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [_duplicateDecisions, _setDuplicateDecisions] = useState<Record<number, string>>({});
  const [batchId, setBatchId] = useState<string>('');

  const handleFileProcessed = async (data: ParsedData) => {
    setParsedData(data);
    setCurrentStep(2);
  };

  const handleMappingComplete = (mappings: any[]) => {
    setFieldMappings(mappings);
    setCurrentStep(3);
  };

  const handleValidationConfigured = async () => {
    // Validar todos os registros usando schemas Zod
    if (parsedData) {
      const validatedRows: any[] = [];
      const errors: Array<{ row: number; errors: Array<{ field: string; message: string }> }> = [];
      
      // Escolher schema baseado no tipo de registro
      const schema = recordType === 'student' ? studentSchema : professionalSchema;
      
      parsedData.rows.forEach((row, index) => {
        // Usar importRecordSchema como base, mas aplicar validações específicas
        const result = validateRecordWithSchema(schema, row);
        if (result.valid) {
          validatedRows.push(row);
        } else {
          errors.push({ row: index + 1, errors: result.errors });
        }
      });
      
      setValidationErrors(errors);
      
      // Buscar duplicados apenas nos registros válidos
      const matchFields = recordType === 'student' ? ['cpf', 'registration_number'] : ['cpf', 'email'];
      const foundDuplicates = await findDuplicates(validatedRows, recordType, matchFields);
      
      setDuplicates(foundDuplicates);
    }
    
    setCurrentStep(4);
  };

  const handleDuplicatesResolved = async (decisions: Record<number, string>) => {
    _setDuplicateDecisions(decisions);
    
    // Criar lote de importação
    if (parsedData) {
      const batch = await createImportBatch(
        parsedData.fileInfo.name,
        parsedData.fileInfo.size,
        parsedData.fileInfo.format,
        parsedData.totalRows
      );
      setBatchId(batch);
    }
    
    setCurrentStep(5);
  };

  const handleImportComplete = (result: any) => {
    console.log('Importação concluída:', result);
  };

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="text-sm text-primary hover:underline mb-2 block">
                <ArrowLeft className="h-4 w-4 inline mr-1" />
                Voltar ao Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground">
                Importação em Lote
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Importe dados de alunos ou profissionais de sistemas externos
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Type Selector */}
        {currentStep === 1 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo de Registro
                  </label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="student">Alunos</option>
                    <option value="professional">Profissionais</option>
                  </select>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {recordType === 'student' && 'Importar matrículas e dados de alunos'}
                    {recordType === 'professional' && 'Importar colaboradores e profissionais'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isClickable = step.id <= currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isClickable && goToStep(step.id)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        currentStep > step.id ? 'bg-green-600' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === 1 && (
            <FileUploader onFileProcessed={handleFileProcessed} />
          )}

          {currentStep === 2 && parsedData && (
            <FieldMapper
              sourceFields={parsedData.headers}
              recordType={recordType}
              onMappingComplete={handleMappingComplete}
            />
          )}

          {currentStep === 3 && (
            <ValidationRules
              recordType={recordType}
              mappedFields={fieldMappings.map(m => m.targetField)}
              onRulesConfigured={handleValidationConfigured}
            />
          )}
          
          {/* Mostrar erros de validação se houver */}
          {validationErrors.length > 0 && currentStep >= 3 && (
            <Card className="mt-6 border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    {validationErrors.length} registro(s) com erros de validação
                  </p>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {validationErrors.slice(0, 10).map((error, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      Linha {error.row}: {error.errors.map(e => e.message).join(', ')}
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <p className="text-xs text-muted-foreground">
                      ... e mais {validationErrors.length - 10} erro(s)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <DuplicateResolver
              duplicates={duplicates}
              onResolved={handleDuplicatesResolved}
            />
          )}

          {currentStep === 5 && parsedData && (
            <ImportProgress
              batchId={batchId}
              totalRecords={parsedData.totalRows}
              onComplete={handleImportComplete}
            />
          )}
        </div>

        {/* Summary Card */}
        {parsedData && currentStep > 1 && currentStep < 5 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {parsedData.fileInfo.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parsedData.totalRows} registros • {parsedData.fileInfo.format.toUpperCase()}
                    </p>
                  </div>
                  {fieldMappings.length > 0 && (
                    <Badge variant="outline">
                      {fieldMappings.length} campos mapeados
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParsedData(null);
                    setCurrentStep(1);
                    setFieldMappings([]);
                    setValidationErrors([]);
                    setDuplicates([]);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}















