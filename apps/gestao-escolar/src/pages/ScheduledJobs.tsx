import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Clock, Play, RefreshCw, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { PageHeader } from '@/components/PageHeader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JobLog {
  id: string;
  job_name: string;
  job_type: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  records_processed: number | null;
  error_message: string | null;
  triggered_by: string;
}

export default function ScheduledJobs() {
  const [jobs, setJobs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_job_history', {
        p_job_name: null,
        p_job_type: null,
        p_status: null,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar jobs: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.job_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesType = filterType === 'all' || job.job_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRunJob = async (_jobName: string) => {
    try {
      const { error } = await supabase.functions.invoke('scheduled-alert-check', {
        body: { job_type: 'alert_check' },
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Job executado com sucesso',
      });

      // Recarregar após 2 segundos
      setTimeout(loadJobs, 2000);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao executar job: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const exportJobsCSV = () => {
    const headers = [
      'Nome',
      'Tipo',
      'Iniciado em',
      'Concluído em',
      'Duração (ms)',
      'Status',
      'Registros Processados',
      'Erro',
      'Trigger',
    ];

    const rows = filteredJobs.map(job => [
      job.job_name,
      job.job_type,
      job.started_at ? format(new Date(job.started_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : '',
      job.completed_at ? format(new Date(job.completed_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : '',
      job.duration_ms?.toFixed(2) || '',
      job.status,
      job.records_processed?.toString() || '',
      job.error_message || '',
      job.triggered_by,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const filename = `jobs-agendados_${formatTimestampForFilename()}.csv`;
    downloadTextFile(csv, filename, 'text/csv');

    toast({
      title: 'Sucesso',
      description: 'CSV exportado com sucesso',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'failed': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'running': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Estatísticas
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    running: jobs.filter(j => j.status === 'running').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Jobs Agendados"
          description="Monitore e gerencie a execução de jobs agendados do sistema"
          actions={
            <>
              <Button variant="outline" onClick={exportJobsCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={() => handleRunJob('scheduled_alert_check')}>
                <Play className="h-4 w-4 mr-2" />
                Executar Verificação de Alertas
              </Button>
              <Button variant="outline" onClick={loadJobs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </>
          }
        />

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Em Execução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.running}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                  <SelectItem value="running">Em execução</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="alert_check">Verificação de Alertas</SelectItem>
                  <SelectItem value="report_generation">Geração de Relatórios</SelectItem>
                  <SelectItem value="data_sync">Sincronização de Dados</SelectItem>
                  <SelectItem value="cleanup">Limpeza</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Jobs */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum job encontrado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{job.job_name}</CardTitle>
                        <Badge className={getStatusColor(job.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(job.status)}
                            {job.status}
                          </span>
                        </Badge>
                        <Badge variant="outline">{job.job_type}</Badge>
                        <Badge variant="outline">{job.triggered_by}</Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                          Iniciado: {format(new Date(job.started_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </span>
                        {job.completed_at && (
                          <span>
                            Concluído: {format(new Date(job.completed_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </span>
                        )}
                        {job.duration_ms && (
                          <span>
                            Duração: {(job.duration_ms / 1000).toFixed(2)}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {job.records_processed !== null && (
                      <div>
                        <span className="text-muted-foreground">Registros: </span>
                        <span className="font-semibold">{job.records_processed}</span>
                      </div>
                    )}
                    {job.error_message && (
                      <div className="col-span-full">
                        <span className="text-muted-foreground">Erro: </span>
                        <span className="text-red-600 dark:text-red-400">{job.error_message}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

