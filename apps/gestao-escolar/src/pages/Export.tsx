import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Filter, FileText, FileSpreadsheet, FileJson, File } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToEducacenso,
  fetchStudentsForExport,
  fetchProfessionalsForExport,
  createExportBatch
} from '../services/exportService';
import { supabase } from '@pei/database';

export default function Export() {
  const [exportType, setExportType] = useState<'students' | 'professionals'>('students');
  const [format, setFormat] = useState<'csv' | 'excel' | 'json' | 'educacenso'>('csv');
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSchools();
    selectDefaultFields();
  }, [exportType]);

  const loadSchools = async () => {
    const { data } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('is_active', true)
      .order('school_name');

    setSchools(data || []);
    if (data && data.length > 0) {
      setSelectedSchool(data[0]?.id || '');
    }
  };

  const selectDefaultFields = () => {
    if (exportType === 'students') {
      setSelectedFields([
        'registration_number',
        'name',
        'cpf',
        'date_of_birth',
        'guardian_name',
        'guardian_phone',
        'status_matricula'
      ]);
    } else {
      setSelectedFields([
        'registration_number',
        'full_name',
        'cpf',
        'email',
        'phone',
        'professional_role',
        'hire_date'
      ]);
    }
  };

  const getAvailableFields = () => {
    if (exportType === 'students') {
      return [
        { value: 'registration_number', label: 'Matrícula' },
        { value: 'codigo_identificador', label: 'Código Identificador' },
        { value: 'name', label: 'Nome do Aluno' },
        { value: 'cpf', label: 'CPF' },
        { value: 'date_of_birth', label: 'Data de Nascimento' },
        { value: 'student_id', label: 'Código INEP' },
        { value: 'guardian_name', label: 'Responsável' },
        { value: 'guardian_phone', label: 'Telefone Responsável' },
        { value: 'numero_bolsa_familia', label: 'Bolsa Família' },
        { value: 'status_matricula', label: 'Situação' },
        { value: 'class_name', label: 'Turma' },
        { value: 'endereco_completo', label: 'Endereço' },
        { value: 'telefone_principal', label: 'Telefone' },
        { value: 'email', label: 'Email' }
      ];
    } else {
      return [
        { value: 'registration_number', label: 'Código' },
        { value: 'full_name', label: 'Nome Completo' },
        { value: 'cpf', label: 'CPF' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Telefone' },
        { value: 'professional_role', label: 'Função' },
        { value: 'hire_date', label: 'Data Admissão' },
        { value: 'termination_date', label: 'Data Demissão' },
        { value: 'specialization', label: 'Especialização' },
        { value: 'formation', label: 'Formação' }
      ];
    }
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(getAvailableFields().map(f => f.value));
  };

  const clearAllFields = () => {
    setSelectedFields([]);
  };

  const loadPreview = async () => {
    setLoading(true);
    try {
      const filters = {
        school_id: selectedSchool,
        academic_year: academicYear,
        is_active: true
      };

      let data: any[] = [];
      if (exportType === 'students') {
        data = await fetchStudentsForExport(filters);
      } else {
        data = await fetchProfessionalsForExport(filters);
      }

      setPreview(data.slice(0, 10)); // Mostrar apenas 10 primeiros
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
      alert('Erro ao carregar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert('Selecione pelo menos um campo para exportar');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        school_id: selectedSchool,
        academic_year: academicYear,
        is_active: true
      };

      // Buscar dados completos
      let data: any[] = [];
      if (exportType === 'students') {
        data = await fetchStudentsForExport(filters);
      } else {
        data = await fetchProfessionalsForExport(filters);
      }

      // Criar lote de exportação
      await createExportBatch(
        `Exportação ${exportType} - ${new Date().toLocaleDateString()}`,
        exportType,
        format,
        filters,
        selectedFields,
        data.length
      );

      // Gerar arquivo (timestamp será adicionado automaticamente pelas funções de exportação)
      const baseFileName = `${exportType}_${academicYear}`;
      const extension = format === 'excel' ? 'xlsx' : format;
      const fileName = `${baseFileName}.${extension}`;

      if (format === 'csv') {
        exportToCSV(data, selectedFields, fileName);
      } else if (format === 'excel') {
        await exportToExcel(data, selectedFields, fileName);
      } else if (format === 'json') {
        exportToJSON(data, selectedFields, fileName);
      } else if (format === 'educacenso') {
        await exportToEducacenso(selectedSchool, academicYear, fileName);
      }

      alert(`Exportação concluída! ${data.length} registros exportados.`);
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const availableFields = getAvailableFields();

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
                Exportação de Dados
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Exporte dados para censo escolar, MEC ou sistemas externos
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button
                    onClick={() => setExportType('students')}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${exportType === 'students'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                      }`}
                  >
                    <p className="font-medium text-foreground">Alunos</p>
                    <p className="text-xs text-muted-foreground">
                      Matrículas e dados de alunos
                    </p>
                  </button>
                  <button
                    onClick={() => setExportType('professionals')}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${exportType === 'professionals'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                      }`}
                  >
                    <p className="font-medium text-foreground">Profissionais</p>
                    <p className="text-xs text-muted-foreground">
                      Colaboradores e professores
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Formato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: 'csv', label: 'CSV', icon: FileText, desc: 'Compatível com Excel' },
                    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, desc: 'Arquivo .xlsx' },
                    { value: 'json', label: 'JSON', icon: FileJson, desc: 'Formato estruturado' },
                    { value: 'educacenso', label: 'Educacenso', icon: File, desc: 'Formato INEP/MEC' }
                  ].map(fmt => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.value}
                        onClick={() => setFormat(fmt.value as any)}
                        className={`w-full p-3 border rounded-lg text-left transition-colors ${format === fmt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent'
                          }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{fmt.label}</p>
                            <p className="text-xs text-muted-foreground">{fmt.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Escola</Label>
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.school_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Ano Letivo</Label>
                  <input
                    type="number"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    min="2020"
                    max="2030"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seleção de Campos */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Campos a Exportar</CardTitle>
                    <CardDescription>
                      Selecione os campos que deseja incluir na exportação
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={selectAllFields} size="sm" variant="outline">
                      Selecionar Todos
                    </Button>
                    <Button onClick={clearAllFields} size="sm" variant="outline">
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableFields.map(field => (
                    <div
                      key={field.value}
                      className="flex items-center space-x-2 p-2 border border-border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => toggleField(field.value)}
                    >
                      <Checkbox
                        checked={selectedFields.includes(field.value)}
                        onCheckedChange={() => toggleField(field.value)}
                      />
                      <Label className="cursor-pointer flex-1 text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{selectedFields.length}</span> campo(s) selecionado(s)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {showPreview && preview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Preview (primeiros 10 registros)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {selectedFields.map(field => (
                            <th key={field} className="px-3 py-2 text-left text-xs font-medium text-foreground">
                              {availableFields.find(f => f.value === field)?.label || field}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.map((row, index) => (
                          <tr key={index} className="hover:bg-accent">
                            {selectedFields.map(field => (
                              <td key={field} className="px-3 py-2 text-foreground">
                                {row[field] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ações */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Pronto para exportar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFields.length} campos • Formato {format.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={loadPreview}
                      variant="outline"
                      disabled={loading || selectedFields.length === 0}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={loading || selectedFields.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? 'Exportando...' : 'Exportar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}











