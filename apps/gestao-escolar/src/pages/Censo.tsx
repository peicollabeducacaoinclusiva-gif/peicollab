import { useState, useEffect } from 'react';
import { Download, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Button, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { educacensoService, type EducacensoValidation } from '../services/educacensoService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface CensoIntegration {
  id: string;
  school_id: string;
  school_name: string;
  academic_year: number;
  sync_type: string;
  sync_status: string;
  sync_date: string;
  last_sync_at: string | null;
  file_format: string | null;
  file_url: string | null;
  records_count: number;
  success_count: number;
  error_count: number;
  warning_count: number;
  inep_validation_code: string | null;
  created_at: string;
}

const syncTypeLabels: Record<string, string> = {
  export: 'Exportação',
  import: 'Importação',
  validation: 'Validação',
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
  processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  validated: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

export default function Censo() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  
  const [integrations, setIntegrations] = useState<CensoIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [validationResult, setValidationResult] = useState<EducacensoValidation | null>(null);
  
  // Filtros
  const [syncTypeFilter, setSyncTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [_importDialogOpen, _setImportDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [_validationDetailsOpen, _setValidationDetailsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadIntegrations();
      if (userProfile.school_id) {
        setSelectedSchool(userProfile.school_id);
      }
    }
  }, [userProfile, selectedSchool, academicYear, syncTypeFilter, statusFilter]);

  async function loadIntegrations() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoading(true);
      // Por enquanto, usar array vazio até a função RPC estar disponível
      // const { data, error } = await supabase.rpc('get_censo_integrations', {
      //   p_school_id: selectedSchool || null,
      //   p_tenant_id: userProfile.tenant_id,
      //   p_academic_year: academicYear,
      //   p_sync_type: syncTypeFilter === 'all' ? null : syncTypeFilter,
      //   p_sync_status: statusFilter === 'all' ? null : statusFilter,
      //   p_limit: 100,
      //   p_offset: 0,
      // });
      // if (error) throw error;
      // setIntegrations(data || []);
      setIntegrations([]);
    } catch (error: any) {
      console.error('Erro ao carregar sincronizações:', error);
      toast.error('Erro ao carregar sincronizações do Censo');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!userProfile?.tenant_id) {
      toast.error('Erro: tenant_id não encontrado');
      return;
    }

    try {
      setProcessing(true);

      // Validar dados antes de exportar
      const validation = await educacensoService.validateData(
        userProfile.tenant_id,
        selectedSchool || undefined,
        academicYear
      );

      if (!validation.valid && validation.total_errors > 0) {
        toast.error(`Validação falhou: ${validation.total_errors} erro(s) encontrado(s)`);
        setValidationResult({
          status: 'invalid',
          errors: validation.errors || [],
          warnings: validation.warnings || [],
          summary: {
            total_students: 0,
            valid_students: 0,
            invalid_students: validation.total_errors || 0,
          },
        });
        _setValidationDetailsOpen(true);
        return;
      }

      if (validation.total_warnings > 0) {
        toast.warning(`Validação com avisos: ${validation.total_warnings} aviso(s)`);
      }

      // Fazer download via Edge Function
      await educacensoService.downloadFile(
        userProfile.tenant_id,
        selectedSchool || undefined,
        academicYear
      );

      toast.success('Arquivo exportado com sucesso');
      setExportDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error(error.message || 'Erro ao exportar dados');
    } finally {
      setProcessing(false);
    }
  }

  async function handleValidate() {
    if (!userProfile?.tenant_id) {
      toast.error('Erro: tenant_id não encontrado');
      return;
    }

    try {
      setProcessing(true);

      const validation = await educacensoService.validateData(
        userProfile.tenant_id,
        selectedSchool || undefined,
        academicYear
      );

      setValidationResult({
        status: validation.valid ? 'valid' : 'invalid',
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        summary: {
          total_students: 0,
          valid_students: 0,
          invalid_students: validation.total_errors || 0,
        },
      });

      if (validation.valid) {
        toast.success('Validação aprovada! Todos os dados estão válidos para o Censo');
      } else if (validation.total_warnings > 0) {
        toast.warning(`Validação com avisos: ${validation.total_warnings} aviso(s)`);
      } else {
        toast.error(`Validação falhou: ${validation.total_errors} erro(s) encontrado(s)`);
      }

      _setValidationDetailsOpen(true);
      setValidationDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao validar:', error);
      toast.error(error.message || 'Erro ao validar dados');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const appUserProfile: AppUserProfile | undefined = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (typeof userProfile.tenant === 'object' && userProfile.tenant !== null && 'network_name' in userProfile.tenant) ? (userProfile.tenant as any).network_name : null,
    school_name: (typeof userProfile.school === 'object' && userProfile.school !== null && 'school_name' in userProfile.school) ? (userProfile.school as any).school_name : null,
  } as AppUserProfile : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Gestão Escolar"
        appLogo="/logo.png"
        currentApp="gestao-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Integração com Censo Escolar</h1>
          <p className="text-muted-foreground mt-1">
            Exportação, importação e validação de dados para o Educacenso/INEP
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="export">Exportação</TabsTrigger>
            <TabsTrigger value="import">Importação</TabsTrigger>
            <TabsTrigger value="validation">Validação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Sincronizações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{integrations.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Concluídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {integrations.filter(i => i.sync_status === 'completed' || i.sync_status === 'validated').length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Em Processamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {integrations.filter(i => i.sync_status === 'processing').length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Falhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {integrations.filter(i => i.sync_status === 'failed').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status de Integração</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sistema de integração com Censo Escolar/EducaCenso em desenvolvimento.
                  Funcionalidades de exportação, importação e validação serão implementadas progressivamente.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exportação */}
          <TabsContent value="export" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Exportação para Censo</h2>
              <Button onClick={() => setExportDialogOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Exportação de Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporte os dados da escola no formato do Educacenso/INEP para envio ao Censo Escolar.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Dados de alunos e matrículas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Dados de profissionais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Dados das escolas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Validação automática antes da exportação</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Importação */}
          <TabsContent value="import" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Importação do Censo</h2>
              <Button onClick={() => _setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Nova Importação
              </Button>
            </div>

            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Funcionalidade de importação em desenvolvimento
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validação */}
          <TabsContent value="validation" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Validação de Dados</h2>
              <Button onClick={() => setValidationDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validar Dados
              </Button>
            </div>

            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validationResult.status === 'valid' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {validationResult.status === 'warning' && (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    {validationResult.status === 'invalid' && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Resultado da Validação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total de Alunos</p>
                      <p className="text-lg font-semibold">{validationResult.summary.total_students}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alunos Válidos</p>
                      <p className="text-lg font-semibold text-green-600">
                        {validationResult.summary.valid_students}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alunos Inválidos</p>
                      <p className="text-lg font-semibold text-red-600">
                        {validationResult.summary.invalid_students}
                      </p>
                    </div>
                  </div>

                  {validationResult.errors.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-red-600 mb-2">
                        Erros ({validationResult.errors.length})
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {validationResult.errors.map((error, idx) => (
                          <div key={idx} className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-yellow-600 mb-2">
                        Avisos ({validationResult.warnings.length})
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {validationResult.warnings.map((warning, idx) => (
                          <div key={idx} className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                            {warning.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!validationResult && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Clique em "Validar Dados" para verificar se os dados estão prontos para exportação
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div>
                <Label htmlFor="academicYear">Ano Letivo:</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-24"
                />
              </div>
              <div>
                <Label htmlFor="syncType">Tipo:</Label>
                <Select value={syncTypeFilter} onValueChange={setSyncTypeFilter}>
                  <SelectTrigger id="syncType" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="export">Exportação</SelectItem>
                    <SelectItem value="import">Importação</SelectItem>
                    <SelectItem value="validation">Validação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="validated">Validada</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {integrations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma sincronização encontrada
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {integrations.map(integration => (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{integration.school_name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {syncTypeLabels[integration.sync_type]} • Ano Letivo {integration.academic_year} • {format(new Date(integration.sync_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge className={statusColors[integration.sync_status]}>
                          {integration.sync_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Registros</p>
                          <p className="text-sm font-medium text-foreground">{integration.records_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sucessos</p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">{integration.success_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Erros</p>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">{integration.error_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avisos</p>
                          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{integration.warning_count}</p>
                        </div>
                      </div>
                      {integration.file_url && (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(integration.file_url!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Arquivo
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Exportação */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar para Censo Escolar</DialogTitle>
            <DialogDescription>
              Gere arquivo no formato do Inep para envio ao EducaCenso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="exportSchool">Escola</Label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger id="exportSchool">
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as Escolas</SelectItem>
                  {schoolsData.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.school_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="exportAcademicYear">Ano Letivo *</Label>
              <Input
                id="exportAcademicYear"
                type="number"
                value={academicYear}
                onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExport} disabled={processing}>
                {processing ? 'Iniciando...' : 'Iniciar Exportação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Validação */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validar Dados para Censo</DialogTitle>
            <DialogDescription>
              Verifique se os dados estão prontos para exportação ao Censo Escolar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                A validação verificará códigos INEP, dados obrigatórios e regras de negócio do Censo.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleValidate} disabled={processing}>
                {processing ? 'Validando...' : 'Iniciar Validação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

