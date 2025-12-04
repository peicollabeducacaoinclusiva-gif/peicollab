import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pei/ui';
import { AlertTriangle, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { getErrorHandler, getMetricsCollector, getAlertManager } from '@pei/observability';

export default function ObservabilityDashboard() {
  const [selectedApp, setSelectedApp] = useState<string>('gestao-escolar');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Estatísticas de erros
  const { data: errorStats, isLoading: loadingErrors } = useQuery({
    queryKey: ['error-statistics', selectedApp, dateRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const { data, error } = await supabase.rpc('get_error_statistics', {
        p_app_name: selectedApp,
        p_tenant_id: null,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Estatísticas de performance
  const { data: performanceStats, isLoading: loadingPerformance } = useQuery({
    queryKey: ['performance-statistics', selectedApp, dateRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const { data, error } = await supabase.rpc('get_performance_statistics', {
        p_app_name: selectedApp,
        p_tenant_id: null,
        p_metric_type: null,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Alertas ativos
  const { data: activeAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['active-alerts', selectedApp],
    queryFn: async () => {
      const alertManager = getAlertManager();
      return await alertManager.getAlerts({
        app_name: selectedApp,
        status: 'active',
        limit: 20,
      });
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Erros recentes
  const { data: recentErrors } = useQuery({
    queryKey: ['recent-errors', selectedApp],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('app_name', selectedApp)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  // Web Vitals atuais
  const metricsCollector = getMetricsCollector();
  const [webVitals, setWebVitals] = useState(metricsCollector.getWebVitals());

  useEffect(() => {
    const interval = setInterval(() => {
      setWebVitals(metricsCollector.getWebVitals());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Observabilidade</h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento de erros, performance e alertas
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="gestao-escolar">Gestão Escolar</option>
            <option value="pei-collab">PEI Collab</option>
            <option value="plano-aee">Plano AEE</option>
            <option value="landing">Landing</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-4 py-2 border rounded-md"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
        </div>
      </div>

      {/* Web Vitals em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LCP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.lcp ? `${Math.round(webVitals.lcp)}ms` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {webVitals.lcp && webVitals.lcp > 2500 ? '⚠️ Lento' : '✅ Bom'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">INP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.inp ? `${Math.round(webVitals.inp)}ms` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {webVitals.inp && webVitals.inp > 200 ? '⚠️ Lento' : '✅ Bom'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">FCP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.fcp ? `${Math.round(webVitals.fcp)}ms` : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TTFB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.ttfb ? `${Math.round(webVitals.ttfb)}ms` : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CLS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.cls ? webVitals.cls.toFixed(3) : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">FID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webVitals.fid ? `${Math.round(webVitals.fid)}ms` : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas de Erros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total de Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingErrors ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold">
                {errorStats?.total_errors || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erros Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingErrors ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {errorStats?.by_severity?.critical || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Não Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingErrors ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {errorStats?.unresolved_count || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {activeAlerts?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas Ativos */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas Ativos</CardTitle>
            <CardDescription>Alertas que requerem atenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-medium">{alert.alert_name}</div>
                    <div className="text-sm text-muted-foreground">{alert.message}</div>
                  </div>
                  <div className={`font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erros Recentes */}
      {recentErrors && recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Erros Recentes</CardTitle>
            <CardDescription>Últimos 10 erros registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentErrors.map((error: any) => (
                <div
                  key={error.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-medium">{error.message}</div>
                    <div className="text-sm text-muted-foreground">
                      {error.error_type} • {new Date(error.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className={`font-medium ${getSeverityColor(error.severity)}`}>
                    {error.severity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

