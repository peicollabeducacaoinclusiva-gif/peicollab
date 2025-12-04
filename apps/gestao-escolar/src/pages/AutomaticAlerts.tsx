import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutomaticAlert {
  id: string;
  rule_code: string;
  entity_type: string;
  entity_id: string;
  alert_type: string;
  alert_message: string;
  alert_data: any;
  school_id: string;
  school_name: string;
  generated_at: string;
  acknowledged_at: string | null;
}

const alertTypeColors: Record<string, string> = {
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-500',
  critical: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-500',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-500',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-500',
};

export default function AutomaticAlerts() {
  const [alerts, setAlerts] = useState<AutomaticAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [resolvingAlert, setResolvingAlert] = useState<AutomaticAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId || schoolId) {
      loadAlerts();
    }
  }, [tenantId, schoolId, filterType]);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setSchoolId(profile.school_id ?? null);
        setTenantId(profile.tenant_id ?? null);
      }
    } catch (error: any) {
      console.error('Erro ao inicializar:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function loadAlerts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_active_alerts', {
        p_tenant_id: tenantId,
        p_school_id: schoolId,
        p_alert_type: filterType === 'all' ? null : filterType,
        p_limit: 100,
      });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar alertas:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      const { error } = await supabase.rpc('acknowledge_alert', {
        p_alert_id: alertId,
      });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Alerta reconhecido' });
      await loadAlerts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function resolveAlert() {
    if (!resolvingAlert) return;

    try {
      const { error } = await supabase.rpc('resolve_alert', {
        p_alert_id: resolvingAlert.id,
        p_resolution_notes: resolutionNotes,
      });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Alerta resolvido' });
      setResolvingAlert(null);
      setResolutionNotes('');
      await loadAlerts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function runCheck() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('run_automatic_alerts_check');

      if (error) throw error;

      toast({ 
        title: 'Sucesso', 
        description: `${data || 0} alertas verificados e gerados` 
      });
      await loadAlerts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const criticalAlerts = alerts.filter(a => a.alert_type === 'critical' || a.alert_type === 'urgent').length;
  const warningAlerts = alerts.filter(a => a.alert_type === 'warning').length;

  if (loading && alerts.length === 0) {
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
      <PageHeader title="Alertas Automáticos" icon={<Bell className="h-6 w-6 text-primary" />} />

      <div className="container mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalAlerts}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas de Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningAlerts}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="filterType">Tipo de Alerta</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="filterType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="warning">Atenção</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={runCheck} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Agora
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alertas */}
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum alerta ativo no momento
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={`border-l-4 ${alertTypeColors[alert.alert_type] || 'border-gray-300'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={alertTypeColors[alert.alert_type]}>
                          {alert.alert_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {alert.rule_code}
                        </span>
                      </div>
                      <CardTitle className="text-lg mb-2">{alert.alert_message}</CardTitle>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Escola:</strong> {alert.school_name || 'N/A'}</p>
                        <p><strong>Entidade:</strong> {alert.entity_type} ({alert.entity_id.substring(0, 8)}...)</p>
                        <p><strong>Gerado em:</strong> {format(new Date(alert.generated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        {alert.acknowledged_at && (
                          <p className="text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Reconhecido em {format(new Date(alert.acknowledged_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.acknowledged_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reconhecer
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResolvingAlert(alert)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Resolver Alerta */}
        <Dialog open={!!resolvingAlert} onOpenChange={(open) => !open && setResolvingAlert(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver Alerta</DialogTitle>
              <DialogDescription>
                Adicione notas sobre a resolução deste alerta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resolutionNotes">Notas de Resolução</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Descreva como o alerta foi resolvido..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={resolveAlert}>Resolver</Button>
                <Button variant="outline" onClick={() => setResolvingAlert(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

