import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@pei/database';
import { retentionService } from '@pei/database/retention';
import { useUserProfile } from '../hooks/useUserProfile';
import { Database, Play, Pause, RefreshCw, Calendar, CheckCircle2, XCircle, Clock, FileText, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RetentionLog {
  id: string;
  tenant_id: string;
  executed_by: string | null;
  dry_run: boolean;
  status: 'completed' | 'failed' | 'in_progress';
  summary: string;
  metadata?: any; // Usar metadata em vez de details
  details?: any; // Compatibilidade
  created_at: string;
}

interface ScheduleStatus {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  status_label: string;
}

interface RetentionRule {
  id: string;
  entity_type: string;
  retention_period_days: number;
  anonymization_strategy: string;
  is_active: boolean;
  description?: string;
}

interface RetentionLogDetail {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  processed_at: string;
  metadata?: any;
}

export default function RetentionDashboard() {
  const { data: userProfile } = useUserProfile();
  const { toast } = useToast();
  const [logs, setLogs] = useState<RetentionLog[]>([]);
  const [retentionRules, setRetentionRules] = useState<RetentionRule[]>([]);
  const [retentionLogs, setRetentionLogs] = useState<RetentionLogDetail[]>([]);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadData();
  }, [userProfile?.tenant_id]);

  async function loadData() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoading(true);

      // Carregar logs de execução de retenção
      const { data: logsData, error: logsError } = await supabase
        .from('retention_execution_logs')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setLogs((logsData || []) as RetentionLog[]);

      // Carregar status do agendamento (se a view existir)
      // Nota: A view retention_schedule_status só existe se pg_cron estiver habilitado
      // Por enquanto, vamos deixar como null e mostrar instruções de configuração
      setScheduleStatus(null);

      // Carregar regras de retenção
      await loadRetentionRules();

      // Carregar logs detalhados de retenção
      await loadRetentionLogs();
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de retenção',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadRetentionRules() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoadingRules(true);
      const rules = await retentionService.getRules(userProfile.tenant_id);
      setRetentionRules(rules as RetentionRule[]);
    } catch (error: any) {
      console.error('Erro ao carregar regras de retenção:', error);
      toast({
        title: 'Aviso',
        description: 'Erro ao carregar regras de retenção',
        variant: 'default',
      });
    } finally {
      setLoadingRules(false);
    }
  }

  async function loadRetentionLogs() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoadingLogs(true);
      const logs = await retentionService.getLogs({
        tenantId: userProfile.tenant_id,
        limit: 100,
      });
      setRetentionLogs(logs as RetentionLogDetail[]);
    } catch (error: any) {
      console.error('Erro ao carregar logs de retenção:', error);
      toast({
        title: 'Aviso',
        description: 'Erro ao carregar logs detalhados de retenção',
        variant: 'default',
      });
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleExecuteRetention(dryRun: boolean = false) {
    if (!userProfile?.tenant_id) {
      toast({
        title: 'Erro',
        description: 'Tenant ID não disponível',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExecuting(true);

      // Chamar RPC de retenção diretamente
      const { data, error } = await supabase.rpc('execute_retention_for_tenant', {
        p_tenant_id: userProfile.tenant_id,
        p_dry_run: dryRun,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: dryRun
          ? 'Execução de teste concluída'
          : 'Retenção aplicada com sucesso',
      });

      // Recarregar dados
      await loadData();
    } catch (error: any) {
      console.error('Erro ao executar retenção:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao executar retenção',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  }

  async function handleToggleSchedule(enabled: boolean) {
    // Nota: O toggle precisa ser configurado manualmente via Supabase Dashboard
    // ou via script externo. Aqui apenas informamos o usuário.
    toast({
      title: 'Configuração necessária',
      description: 'Configure o agendamento via Supabase Dashboard > Database > Cron Jobs. Veja a documentação para mais detalhes.',
      variant: 'default',
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Concluído</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Falhou</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Em Progresso</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Retenção de Dados"
        icon={<Database className="h-6 w-6 text-primary" />}
        description="Monitore e gerencie as políticas de retenção e anonimização de dados. Execute regras de retenção sob demanda ou configure agendamento automático."
      />

      <div className="container mx-auto px-4 py-6">
        {/* Status do Agendamento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agendamento Automático
              </span>
              {scheduleStatus && (
                <div className="flex items-center gap-2">
                  {scheduleStatus.active ? (
                    <>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSchedule(false)}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Desativar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary">Inativo</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSchedule(true)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ativar
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardTitle>
            <CardDescription>
              {scheduleStatus?.schedule
                ? `Execução automática: ${scheduleStatus.schedule}`
                : 'Agendamento não configurado'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Ações Manuais */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Execução Manual</CardTitle>
            <CardDescription>
              Execute a retenção de dados manualmente (teste ou execução real)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => handleExecuteRetention(true)}
                disabled={executing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${executing ? 'animate-spin' : ''}`} />
                Executar Teste (Dry Run)
              </Button>
              <Button
                onClick={() => handleExecuteRetention(false)}
                disabled={executing}
                variant="default"
              >
                <Play className={`h-4 w-4 mr-2 ${executing ? 'animate-spin' : ''}`} />
                Executar Retenção
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal em Abas */}
        <Tabs defaultValue="executions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="executions">
              <Clock className="h-4 w-4 mr-2" />
              Execuções
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Settings className="h-4 w-4 mr-2" />
              Regras ({retentionRules.length})
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="h-4 w-4 mr-2" />
              Logs Detalhados ({retentionLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* Aba: Execuções */}
          <TabsContent value="executions">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
                <CardDescription>
                  Últimas 50 execuções de retenção de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma execução encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <Badge variant={log.dry_run ? 'outline' : 'default'}>
                          {log.dry_run ? 'Teste' : 'Real'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.summary}</TableCell>
                      <TableCell>
                        {(log.metadata || log.details) && typeof (log.metadata || log.details) === 'object' ? (
                          <pre className="text-xs max-w-md overflow-auto">
                            {JSON.stringify(log.metadata || log.details, null, 2)}
                          </pre>
                        ) : (
                          (log.metadata || log.details)?.toString() || '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </TabsContent>

          {/* Aba: Regras */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Retenção</CardTitle>
                <CardDescription>
                  Regras ativas para retenção e anonimização de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRules ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando regras...</p>
                  </div>
                ) : retentionRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma regra configurada
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Entidade</TableHead>
                        <TableHead>Período (dias)</TableHead>
                        <TableHead>Estratégia</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retentionRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.entity_type}</TableCell>
                          <TableCell>{rule.retention_period_days} dias</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.anonymization_strategy}</Badge>
                          </TableCell>
                          <TableCell>
                            {rule.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                            ) : (
                              <Badge variant="secondary">Inativa</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {rule.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Logs Detalhados */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs Detalhados de Retenção</CardTitle>
                <CardDescription>
                  Últimas 100 ações de retenção (anonimização, exclusão, arquivamento)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando logs...</p>
                  </div>
                ) : retentionLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>ID da Entidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retentionLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.processed_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">{log.entity_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.entity_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                log.action === 'anonymized'
                                  ? 'bg-blue-100 text-blue-800'
                                  : log.action === 'deleted'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {log.action === 'anonymized' ? 'Anonimizado' : log.action === 'deleted' ? 'Excluído' : 'Arquivado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

