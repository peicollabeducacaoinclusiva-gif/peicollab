import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import { attendanceService, type StudentBelowThreshold } from '../services/attendanceService';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  Users,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AttendanceAlertsDashboardProps {
  schoolId?: string;
}

export default function AttendanceAlertsDashboard({ schoolId }: AttendanceAlertsDashboardProps) {
  const [alerts, setAlerts] = useState<StudentBelowThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'ALERTA' | 'CRÍTICO' | 'all'>('all');
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const threshold = selectedStatus === 'CRÍTICO' ? 50 : 75;
      const data = await attendanceService.getStudentsBelowThreshold(schoolId, threshold);
      setAlerts(data);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar alertas de frequência',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [schoolId, selectedStatus]);

  const criticalAlerts = alerts.filter(a => a.status === 'CRÍTICO');
  const warningAlerts = alerts.filter(a => a.status === 'ALERTA');

  // Dados para gráfico
  const chartData = [
    { name: 'OK (≥75%)', value: 0, color: '#22c55e' },
    { name: 'Alerta (50-74%)', value: warningAlerts.length, color: '#f59e0b' },
    { name: 'Crítico (<50%)', value: criticalAlerts.length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertas de Frequência
              </CardTitle>
              <CardDescription>
                Alunos com frequência abaixo do mínimo legal (75%)
              </CardDescription>
            </div>
            <Button onClick={loadAlerts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Alertas</p>
                        <p className="text-2xl font-bold">{alerts.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Críticos (&lt;50%)</p>
                        <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Alertas (50-74%)</p>
                        <p className="text-2xl font-bold text-orange-600">{warningAlerts.length}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm">Distribuição de Frequência</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Filtros */}
              <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">Todos ({alerts.length})</TabsTrigger>
                  <TabsTrigger value="CRÍTICO">Críticos ({criticalAlerts.length})</TabsTrigger>
                  <TabsTrigger value="ALERTA">Alertas ({warningAlerts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <AlertList alerts={alerts} />
                </TabsContent>

                <TabsContent value="CRÍTICO" className="mt-4">
                  <AlertList alerts={criticalAlerts} />
                </TabsContent>

                <TabsContent value="ALERTA" className="mt-4">
                  <AlertList alerts={warningAlerts} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertList({ alerts }: { alerts: StudentBelowThreshold[] }) {
  if (alerts.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Nenhum alerta</AlertTitle>
        <AlertDescription>
          Todos os alunos estão com frequência adequada.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert
          key={`${alert.student_id}-${alert.enrollment_id}`}
          variant={alert.status === 'CRÍTICO' ? 'destructive' : 'default'}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                {alert.status === 'CRÍTICO' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {alert.student_name}
              </AlertTitle>
              <AlertDescription className="mt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Turma:</span> {alert.class_name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Frequência:</span>{' '}
                    <span className={alert.attendance_percentage < 50 ? 'text-red-600 font-bold' : 'text-orange-600'}>
                      {alert.attendance_percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Faltas:</span> {alert.absent_classes} de {alert.total_classes}
                  </div>
                  <div>
                    <span className="font-medium">Período:</span>{' '}
                    {new Date(alert.period_start).toLocaleDateString('pt-BR')} - {new Date(alert.period_end).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={alert.status === 'CRÍTICO' ? 'destructive' : 'secondary'}>
                    {alert.status}
                  </Badge>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}

