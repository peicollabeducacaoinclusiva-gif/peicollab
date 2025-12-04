import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Clock, X, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alertService, Alert, AlertType } from '@/services/alertService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AlertsDashboard() {
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'active' | 'all'>('active');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadAlerts();
  }, [userProfile, filterStatus]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getActiveAlerts(
        userProfile?.tenant_id,
        userProfile?.school_id
      );
      setAlerts(data);
    } catch (error) {
      toast.error('Erro ao carregar alertas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertService.acknowledgeAlert(alertId, userProfile?.id || '');
      await loadAlerts();
      toast.success('Alerta reconhecido');
    } catch (error) {
      toast.error('Erro ao reconhecer alerta');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await alertService.resolveAlert(alertId);
      await loadAlerts();
      toast.success('Alerta resolvido');
    } catch (error) {
      toast.error('Erro ao resolver alerta');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítico';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Médio';
      default:
        return 'Baixo';
    }
  };

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case 'low_attendance':
        return 'Frequência Baixa';
      case 'critical_grade':
        return 'Nota Crítica';
      case 'pei_goal_at_risk':
        return 'Meta PEI em Risco';
      case 'aee_missing':
        return 'Sessões AEE Faltantes';
      default:
        return type;
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === 'active' && alert.status !== 'active') return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterType !== 'all' && alert.alert_type !== filterType) return false;
    return true;
  });

  const alertsBySeverity = {
    critical: filteredAlerts.filter((a) => a.severity === 'critical').length,
    high: filteredAlerts.filter((a) => a.severity === 'high').length,
    medium: filteredAlerts.filter((a) => a.severity === 'medium').length,
    low: filteredAlerts.filter((a) => a.severity === 'low').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Automáticos
              </CardTitle>
              <CardDescription>
                Alertas gerados automaticamente pelo sistema
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadAlerts}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
              <div className="text-2xl font-bold text-red-600">{alertsBySeverity.critical}</div>
              <div className="text-sm text-muted-foreground">Críticos</div>
            </div>
            <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
              <div className="text-2xl font-bold text-orange-600">{alertsBySeverity.high}</div>
              <div className="text-sm text-muted-foreground">Altos</div>
            </div>
            <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
              <div className="text-2xl font-bold text-yellow-600">{alertsBySeverity.medium}</div>
              <div className="text-sm text-muted-foreground">Médios</div>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
              <div className="text-2xl font-bold text-blue-600">{alertsBySeverity.low}</div>
              <div className="text-sm text-muted-foreground">Baixos</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mb-4">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'active' | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="low_attendance">Frequência Baixa</SelectItem>
                <SelectItem value="critical_grade">Nota Crítica</SelectItem>
                <SelectItem value="pei_goal_at_risk">Meta PEI em Risco</SelectItem>
                <SelectItem value="aee_missing">Sessões AEE Faltantes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Alertas */}
          <ScrollArea className="h-[600px]">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum alerta encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`border-l-4 ${
                      alert.severity === 'critical'
                        ? 'border-l-red-600'
                        : alert.severity === 'high'
                          ? 'border-l-orange-600'
                          : alert.severity === 'medium'
                            ? 'border-l-yellow-600'
                            : 'border-l-blue-600'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {getSeverityLabel(alert.severity)}
                            </Badge>
                            <Badge variant="outline">{getTypeLabel(alert.alert_type)}</Badge>
                            {alert.status === 'acknowledged' && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Reconhecido
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium mb-1">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Aluno:{' '}
                              <button
                                onClick={() => navigate(`/students/${alert.student_id}/profile`)}
                                className="text-primary hover:underline"
                              >
                                {alert.student?.name || 'N/A'}
                              </button>
                            </span>
                            <span>
                              {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {alert.status === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAcknowledge(alert.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Reconhecer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolve(alert.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Resolver
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

