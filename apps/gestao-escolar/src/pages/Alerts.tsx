import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Textarea, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AttendanceAlertsDashboard from '@/components/AttendanceAlertsDashboard';

interface StudentAlert {
  id: string;
  student_id: string;
  student_name: string;
  school_id: string;
  school_name: string;
  alert_type: string;
  severity: string;
  description: string;
  recommended_action: string | null;
  related_data: any;
  acknowledged_by: string | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

const alertTypeLabels: Record<string, string> = {
  evasao: 'Evasão',
  baixo_desempenho: 'Baixo Desempenho',
  ausencia_prolongada: 'Ausência Prolongada',
  frequencia_baixa: 'Frequência Baixa',
  comportamento: 'Comportamento',
  outro: 'Outro',
};

const severityColors: Record<string, string> = {
  baixa: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800',
  media: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  alta: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  critica: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<StudentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filtros
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<boolean>(false);
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StudentAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId || schoolId) {
      loadAlerts();
    }
  }, [tenantId, schoolId, alertTypeFilter, severityFilter, resolvedFilter]);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id, id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
        const { data: userTenant } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userTenant) {
          setTenantId(userTenant.tenant_id);
        }
      }

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      }

      if (profile?.id) {
        setUserId(profile.id);
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  }

  async function loadAlerts() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_student_alerts', {
        p_school_id: schoolId || null,
        p_tenant_id: tenantId || null,
        p_student_id: null,
        p_alert_type: alertTypeFilter === 'all' ? null : alertTypeFilter,
        p_severity: severityFilter === 'all' ? null : severityFilter,
        p_resolved: resolvedFilter,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar alertas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar alertas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAlerts() {
    if (!schoolId) {
      toast({
        title: 'Atenção',
        description: 'Escola não identificada',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const { data, error } = await supabase.rpc('generate_alerts_for_school', {
        p_school_id: schoolId,
        p_academic_year: null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${data || 0} alerta(s) gerado(s)`,
      });

      await loadAlerts();
    } catch (error: any) {
      console.error('Erro ao gerar alertas:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao gerar alertas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleAcknowledge(alertId: string) {
    try {
      const { error } = await supabase.rpc('acknowledge_alert', {
        p_alert_id: alertId,
        p_user_id: userId,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Alerta reconhecido',
      });

      await loadAlerts();
    } catch (error: any) {
      console.error('Erro ao reconhecer alerta:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao reconhecer alerta',
        variant: 'destructive',
      });
    }
  }

  async function handleResolve() {
    if (!selectedAlert) return;

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('resolve_alert', {
        p_alert_id: selectedAlert.id,
        p_resolution_notes: resolutionNotes || null,
        p_user_id: userId,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Alerta resolvido',
      });

      setResolveDialogOpen(false);
      setSelectedAlert(null);
      setResolutionNotes('');
      await loadAlerts();
    } catch (error: any) {
      console.error('Erro ao resolver alerta:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao resolver alerta',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  const criticalCount = alerts.filter(a => a.severity === 'critica' && !a.resolved_at).length;
  const highCount = alerts.filter(a => a.severity === 'alta' && !a.resolved_at).length;
  const unresolvedCount = alerts.filter(a => !a.resolved_at).length;

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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Alertas e Monitoramento</h1>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateAlerts} variant="outline" disabled={processing}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Alertas
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs para diferentes tipos de alertas */}
        <Tabs defaultValue="geral" className="mb-6">
          <TabsList>
            <TabsTrigger value="geral">Alertas Gerais</TabsTrigger>
            <TabsTrigger value="frequencia">Frequência (75%)</TabsTrigger>
          </TabsList>

          <TabsContent value="frequencia" className="mt-6">
            <AttendanceAlertsDashboard schoolId={schoolId || undefined} />
          </TabsContent>

          <TabsContent value="geral" className="mt-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Não Resolvidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {unresolvedCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alta Severidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {highCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700 dark:text-red-500">
                {criticalCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="alertType">Tipo de Alerta</Label>
                <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                  <SelectTrigger id="alertType">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="evasao">Evasão</SelectItem>
                    <SelectItem value="baixo_desempenho">Baixo Desempenho</SelectItem>
                    <SelectItem value="ausencia_prolongada">Ausência Prolongada</SelectItem>
                    <SelectItem value="frequencia_baixa">Frequência Baixa</SelectItem>
                    <SelectItem value="comportamento">Comportamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severidade</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Todas as severidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as severidades</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resolved">Status</Label>
                <Select 
                  value={resolvedFilter ? 'resolved' : 'unresolved'} 
                  onValueChange={(v) => setResolvedFilter(v === 'resolved')}
                >
                  <SelectTrigger id="resolved">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unresolved">Não Resolvidos</SelectItem>
                    <SelectItem value="resolved">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alertas */}
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum alerta encontrado
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <Card 
                key={alert.id} 
                className={`hover:shadow-md transition-shadow ${
                  alert.severity === 'critica' && !alert.resolved_at ? 'border-red-500' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.severity === 'critica' ? 'text-red-600 dark:text-red-400' :
                          alert.severity === 'alta' ? 'text-orange-600 dark:text-orange-400' :
                          alert.severity === 'media' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`} />
                        <CardTitle className="text-lg">{alert.student_name}</CardTitle>
                        <Badge className={severityColors[alert.severity]}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alertTypeLabels[alert.alert_type]}
                        </Badge>
                        {alert.resolved_at && (
                          <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.school_name} • {format(new Date(alert.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">{alert.description}</p>
                    {alert.recommended_action && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>Ação Recomendada:</strong> {alert.recommended_action}
                        </p>
                      </div>
                    )}
                    {alert.acknowledged_at && (
                      <p className="text-xs text-muted-foreground">
                        Reconhecido por {alert.acknowledged_by_name} em {format(new Date(alert.acknowledged_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {alert.resolved_at && alert.resolution_notes && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          <strong>Resolução:</strong> {alert.resolution_notes}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      {!alert.acknowledged_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reconhecer
                        </Button>
                      )}
                      {!alert.resolved_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setResolveDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Alerta</DialogTitle>
            <DialogDescription>
              Informações completas sobre o alerta
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aluno</Label>
                  <p className="text-sm font-medium text-foreground">{selectedAlert.student_name}</p>
                </div>
                <div>
                  <Label>Escola</Label>
                  <p className="text-sm font-medium text-foreground">{selectedAlert.school_name}</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <p className="text-sm font-medium text-foreground">{alertTypeLabels[selectedAlert.alert_type]}</p>
                </div>
                <div>
                  <Label>Severidade</Label>
                  <Badge className={severityColors[selectedAlert.severity]}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-foreground mt-1">{selectedAlert.description}</p>
              </div>

              {selectedAlert.recommended_action && (
                <div>
                  <Label>Ação Recomendada</Label>
                  <p className="text-sm text-foreground mt-1">{selectedAlert.recommended_action}</p>
                </div>
              )}

              {selectedAlert.related_data && Object.keys(selectedAlert.related_data).length > 0 && (
                <div>
                  <Label>Dados Relacionados</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                    {JSON.stringify(selectedAlert.related_data, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Resolver */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>
              Informe as ações tomadas para resolver este alerta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resolutionNotes">Notas de Resolução</Label>
              <Textarea
                id="resolutionNotes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Descreva as ações tomadas para resolver o alerta..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setResolveDialogOpen(false);
                setResolutionNotes('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleResolve} disabled={processing}>
                {processing ? 'Resolvendo...' : 'Resolver Alerta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

