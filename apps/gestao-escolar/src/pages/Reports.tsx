import { useState, useEffect } from 'react';
import { Download, Filter, BarChart3 } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { reportService, type ReportDefinition, type ReportResult } from '../services/reportService';
import { supabase } from '@pei/database';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { toast } from 'sonner';
import { AccessibleTable } from '@pei/ui';

const CATEGORY_LABELS: Record<string, string> = {
  students: 'Alunos',
  academic: 'Acadêmico',
  attendance: 'Frequência',
  staff: 'Profissionais',
  censo: 'Censo',
  financial: 'Financeiro',
};

export default function Reports() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const [reportDefinitions] = useState<ReportDefinition[]>(reportService.getReportDefinitions());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [subjects, setSubjects] = useState<Array<{ id: string; subject_name: string }>>([]);
  const [professionals, setProfessionals] = useState<Array<{ id: string; full_name: string }>>([]);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadSubjects();
      loadProfessionals();
    }
  }, [userProfile]);

  async function loadSubjects() {
    if (!userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  }

  async function loadProfessionals() {
    if (!userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar profissionais:', error);
    }
  }

  function handleSelectReport(report: ReportDefinition) {
    setSelectedReport(report);
    setParameters({});
    setGenerateDialogOpen(true);
  }

  async function handleGenerateReport() {
    if (!selectedReport || !userProfile?.tenant_id) return;

    // Validar parâmetros obrigatórios
    const missingParams = selectedReport.parameters
      .filter(p => p.required && !parameters[p.name])
      .map(p => p.label);

    if (missingParams.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingParams.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      const result = await reportService.generateReport(
        selectedReport.id,
        parameters,
        userProfile.tenant_id
      );
      setReportResult(result);
      setGenerateDialogOpen(false);
      toast.success('Relatório gerado com sucesso');
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(error.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (!reportResult) return;

    try {
      const ts = formatTimestampForFilename();
      const csv = [
        reportResult.headers.join(','),
        ...reportResult.rows.map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      const filename = `relatorio-${selectedReport?.id || 'geral'}-${ts}.csv`;
      downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
      toast.success('Relatório exportado com sucesso');
    } catch (error: any) {
      toast.error('Erro ao exportar relatório');
    }
  }

  function handleExportExcel() {
    // TODO: Implementar exportação para Excel usando xlsx
    toast.info('Exportação para Excel em desenvolvimento');
  }

  const filteredReports = selectedCategory === 'all'
    ? reportDefinitions
    : reportDefinitions.filter(r => r.category === selectedCategory);

  const filteredClasses = classesData?.data?.filter(
    cls => !parameters.schoolId || cls.school_id === parameters.schoolId
  ) || [];

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (userProfile.tenant as any)?.network_name || null,
    school_name: (userProfile.school as any)?.school_name || null,
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Gestão Escolar"
        appLogo="/logo.png"
        currentApp="gestao-escolar"
        userProfile={appUserProfile as any}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Relatórios e Indicadores</h1>
          <p className="text-muted-foreground mt-1">
            Mais de {reportDefinitions.length} relatórios pré-configurados disponíveis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Relatórios */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Relatórios Disponíveis</CardTitle>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredReports.map((report) => (
                    <Card
                      key={report.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectReport(report)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm">{report.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[report.category]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {report.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultado do Relatório */}
          <div className="lg:col-span-2">
            {reportResult ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedReport?.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedReport?.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportResult.summary && (
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Resumo</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(reportResult.summary).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground">{key}</p>
                            <p className="font-semibold">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <AccessibleTable
                      columns={reportResult.headers.map(header => ({
                        key: header.toLowerCase().replace(/\s+/g, '_'),
                        label: header,
                        'aria-label': header,
                      }))}
                      data={reportResult.rows.map((row, _idx) => {
                        const rowData: Record<string, any> = {};
                        reportResult.headers.forEach((header, colIdx) => {
                          rowData[header.toLowerCase().replace(/\s+/g, '_')] = row[colIdx] || '-';
                        });
                        return rowData;
                      })}
                      aria-label={`Resultado do relatório ${selectedReport?.name}`}
                    />
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    Total de registros: {reportResult.rows.length}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um relatório da lista para gerar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Gerar Relatório */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>{selectedReport?.description}</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {selectedReport.parameters.map((param) => (
                <div key={param.name}>
                  <Label htmlFor={param.name}>
                    {param.label} {param.required && '*'}
                  </Label>
                  {param.type === 'select' ? (
                    <Select
                      value={parameters[param.name] || ''}
                      onValueChange={(value) =>
                        setParameters({ ...parameters, [param.name]: value })
                      }
                    >
                      <SelectTrigger id={param.name}>
                        <SelectValue placeholder={`Selecione ${param.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {param.name === 'schoolId' && (
                          <>
                            <SelectItem value="">Todas</SelectItem>
                            {schoolsData.map((school) => (
                              <SelectItem key={school.id} value={school.id}>
                                {school.school_name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {param.name === 'classId' && (
                          <>
                            <SelectItem value="">Todas</SelectItem>
                            {filteredClasses.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.class_name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {param.name === 'subjectId' && (
                          <>
                            <SelectItem value="">Todas</SelectItem>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.subject_name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {param.name === 'teacherId' && (
                          <>
                            <SelectItem value="">Todos</SelectItem>
                            {professionals.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.full_name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {param.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : param.type === 'number' ? (
                    <Input
                      id={param.name}
                      type="number"
                      value={parameters[param.name] || ''}
                      onChange={(e) =>
                        setParameters({ ...parameters, [param.name]: e.target.value })
                      }
                      placeholder={param.label}
                      required={param.required}
                    />
                  ) : param.type === 'date' ? (
                    <Input
                      id={param.name}
                      type="date"
                      value={parameters[param.name] || ''}
                      onChange={(e) =>
                        setParameters({ ...parameters, [param.name]: e.target.value })
                      }
                      required={param.required}
                    />
                  ) : (
                    <Input
                      id={param.name}
                      value={parameters[param.name] || ''}
                      onChange={(e) =>
                        setParameters({ ...parameters, [param.name]: e.target.value })
                      }
                      placeholder={param.label}
                      required={param.required}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerateReport} disabled={loading}>
                  {loading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

