import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Activity, Shield, FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Input } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/PageHeader';

interface PerformanceMetric {
  endpoint: string;
  operation_type: string;
  avg_execution_time_ms: number;
  min_execution_time_ms: number;
  max_execution_time_ms: number;
  p95_execution_time_ms: number;
  total_operations: number;
  success_count: number;
  error_count: number;
  avg_records_processed: number;
  last_execution: string;
}

interface AuditLog {
  id: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  action_description: string;
  created_at: string;
}

interface SecurityAlert {
  id: string;
  user_name: string | null;
  event_type: string;
  severity: string;
  event_description: string;
  ip_address: string | null;
  is_resolved: boolean;
  created_at: string;
}

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

export default function Monitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dateStart, setDateStart] = useState<string>(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateEnd, setDateEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [dateStart, dateEnd, severityFilter]);

  async function loadData() {
    try {
      setLoading(true);

      // Carregar métricas de performance
      const { data: metricsData, error: metricsError } = await supabase.rpc('get_performance_metrics', {
        p_endpoint: null,
        p_operation_type: null,
        p_start_date: new Date(dateStart).toISOString(),
        p_end_date: new Date(dateEnd + 'T23:59:59').toISOString(),
        p_limit: 50,
      });

      if (metricsError) throw metricsError;
      setMetrics(metricsData || []);

      // Carregar logs de auditoria usando get_audit_trail (audit_events)
      // Obter tenant_id do perfil do usuário
      const { data: { user } } = await supabase.auth.getUser();
      let tenantId: string | null = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        tenantId = profile?.tenant_id || null;
      }

      if (tenantId) {
        const { data: auditData, error: auditError } = await supabase.rpc('get_audit_trail', {
          p_tenant_id: tenantId,
          p_entity_type: null,
          p_entity_id: null,
          p_action: null,
          p_actor_id: null,
          p_start_date: new Date(dateStart).toISOString(),
          p_end_date: new Date(dateEnd + 'T23:59:59').toISOString(),
          p_limit: 100,
        });

        if (auditError) {
          console.warn('Erro ao carregar logs de auditoria:', auditError);
        } else {
          setAuditLogs(auditData || []);
        }
      } else {
        console.warn('tenantId não encontrado, não é possível carregar logs de auditoria');
        setAuditLogs([]);
      }

      // Carregar alertas de segurança
      const { data: securityData, error: securityError } = await supabase.rpc('get_security_alerts', {
        p_severity: severityFilter === 'all' ? null : severityFilter,
        p_event_type: null,
        p_is_resolved: false,
        p_start_date: new Date(dateStart).toISOString(),
        p_end_date: new Date(dateEnd + 'T23:59:59').toISOString(),
        p_limit: 100,
      });

      if (securityError) throw securityError;
      setSecurityAlerts(securityData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de monitoramento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const criticalAlerts = securityAlerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;
  const avgResponseTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.avg_execution_time_ms, 0) / metrics.length 
    : 0;
  const errorRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.error_count / m.total_operations), 0) / metrics.length * 100
    : 0;

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
      <PageHeader
        title="Monitoramento e Auditoria"
        icon={<Activity className="h-6 w-6 text-primary" />}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dateStart">Data Inicial</Label>
                <Input
                  id="dateStart"
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateEnd">Data Final</Label>
                <Input
                  id="dateEnd"
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="severity">Severidade</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo Médio de Resposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-foreground">
                  {avgResponseTime.toFixed(0)}ms
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Erro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {errorRate.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {criticalAlerts}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Operações Registradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-2xl font-bold text-foreground">
                  {metrics.reduce((sum, m) => sum + m.total_operations, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="h-4 w-4 mr-2" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-4">
            {metrics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma métrica encontrada
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {metrics.map((metric, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{metric.endpoint || 'N/A'}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metric.operation_type} • {metric.total_operations} operações
                          </p>
                        </div>
                        <Badge variant={metric.avg_execution_time_ms > 2000 ? 'destructive' : 'default'}>
                          {metric.avg_execution_time_ms.toFixed(0)}ms
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Média</p>
                          <p className="text-sm font-medium text-foreground">{metric.avg_execution_time_ms.toFixed(0)}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">P95</p>
                          <p className="text-sm font-medium text-foreground">{metric.p95_execution_time_ms.toFixed(0)}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sucessos</p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">{metric.success_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Erros</p>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">{metric.error_count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Auditoria */}
          <TabsContent value="audit" className="space-y-4">
            {auditLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum log de auditoria encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <Card key={log.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{log.action_description || `${log.action_type} ${log.entity_type}`}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.user_name || 'Sistema'} • {format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge>{log.action_type}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="security" className="space-y-4">
            {securityAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum alerta de segurança encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {securityAlerts.map(alert => (
                  <Card key={alert.id} className={alert.severity === 'critical' ? 'border-red-500' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{alert.event_description}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.user_name || 'Sistema'} • {format(new Date(alert.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            {alert.ip_address && ` • IP: ${alert.ip_address}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={severityColors[alert.severity]}>
                            {alert.severity}
                          </Badge>
                          {alert.is_resolved && (
                            <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolvido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

