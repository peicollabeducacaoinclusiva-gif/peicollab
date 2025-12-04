import { useState, useEffect } from 'react';
import { Database, Play, Pause, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserProfile } from '../hooks/useUserProfile';
import { backupService, type BackupJob, type BackupExecution, type RestoreOperation } from '../services/backupService';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BackupManagement() {
  const { data: userProfile } = useUserProfile();
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [executions, setExecutions] = useState<BackupExecution[]>([]);
  const [restoreOperations, setRestoreOperations] = useState<RestoreOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupExecution | null>(null);

  // Form states
  const [jobName, setJobName] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly' | 'manual'>('daily');
  const [scheduleTime, setScheduleTime] = useState('03:00');
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'differential'>('full');
  const [retentionDays, setRetentionDays] = useState('30');

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadData();
    }
  }, [userProfile]);

  async function loadData() {
    try {
      setLoading(true);
      const [jobsData, executionsData, restoreData] = await Promise.all([
        backupService.getBackupJobs(userProfile?.tenant_id ?? undefined),
        backupService.getBackupExecutions(undefined, userProfile?.tenant_id ?? undefined),
        backupService.getRestoreOperations(),
      ]);

      setJobs(jobsData);
      setExecutions(executionsData);
      setRestoreOperations(restoreData);
    } catch (error: any) {
      console.error('Erro ao carregar dados de backup:', error);
      toast.error('Erro ao carregar dados de backup');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateJob() {
    if (!jobName.trim() || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      await backupService.createBackupJob({
        tenant_id: userProfile.tenant_id,
        job_name: jobName,
        schedule_type: scheduleType,
        schedule_time: scheduleType !== 'manual' ? scheduleTime : undefined,
        backup_type: backupType,
        retention_days: parseInt(retentionDays),
        enabled: true,
        created_by: user.id,
      });

      toast.success('Job de backup criado com sucesso');
      setCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar job:', error);
      toast.error(error.message || 'Erro ao criar job de backup');
    }
  }

  async function handleExecuteBackup(jobId: string) {
    try {
      toast.info('Iniciando backup...');
      await backupService.executeBackup(jobId);
      toast.success('Backup iniciado com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao executar backup:', error);
      toast.error(error.message || 'Erro ao executar backup');
    }
  }

  async function handleToggleJob(jobId: string, enabled: boolean) {
    try {
      await backupService.updateBackupJob(jobId, { enabled: !enabled });
      toast.success(`Job ${!enabled ? 'habilitado' : 'desabilitado'}`);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar job:', error);
      toast.error('Erro ao atualizar job');
    }
  }

  async function handleRestore(execution: BackupExecution) {
    if (!confirm('ATENÇÃO: Esta operação irá restaurar dados do backup. Deseja continuar?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await backupService.createRestoreOperation(
        execution.id,
        'full',
        undefined,
        user?.id
      );

      toast.success('Operação de restauração iniciada');
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao iniciar restauração:', error);
      toast.error(error.message || 'Erro ao iniciar restauração');
    }
  }

  function resetForm() {
    setJobName('');
    setScheduleType('daily');
    setScheduleTime('03:00');
    setBackupType('full');
    setRetentionDays('30');
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };

    const icons: Record<string, any> = {
      completed: CheckCircle,
      running: Clock,
      failed: XCircle,
      pending: Clock,
      cancelled: XCircle,
    };

    const Icon = icons[status] || AlertCircle;

    return (
      <Badge className={colors[status] || 'bg-gray-100'}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'completed' ? 'Concluído' :
         status === 'running' ? 'Em Execução' :
         status === 'failed' ? 'Falhou' :
         status === 'pending' ? 'Pendente' :
         status === 'cancelled' ? 'Cancelado' : status}
      </Badge>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Backup</h1>
            <p className="text-muted-foreground mt-1">
              Configure e gerencie backups automáticos do sistema
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Database className="h-4 w-4 mr-2" />
            Novo Job de Backup
          </Button>
        </div>

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs">
              <Database className="h-4 w-4 mr-2" />
              Jobs de Backup
            </TabsTrigger>
            <TabsTrigger value="executions">
              <Clock className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="restore">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurações
            </TabsTrigger>
          </TabsList>

          {/* Aba: Jobs */}
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Jobs de Backup Configurados</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Nenhum job de backup configurado</p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      Criar Primeiro Job
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Agendamento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Retenção</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Execução</TableHead>
                        <TableHead>Próxima Execução</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.job_name}</TableCell>
                          <TableCell>
                            {job.schedule_type === 'daily' && 'Diário'}
                            {job.schedule_type === 'weekly' && 'Semanal'}
                            {job.schedule_type === 'monthly' && 'Mensal'}
                            {job.schedule_type === 'manual' && 'Manual'}
                            {job.schedule_time && ` às ${job.schedule_time}`}
                          </TableCell>
                          <TableCell>
                            {job.backup_type === 'full' && 'Completo'}
                            {job.backup_type === 'incremental' && 'Incremental'}
                            {job.backup_type === 'differential' && 'Diferencial'}
                          </TableCell>
                          <TableCell>{job.retention_days} dias</TableCell>
                          <TableCell>
                            <Badge variant={job.enabled ? 'default' : 'secondary'}>
                              {job.enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {job.last_run_at
                              ? format(new Date(job.last_run_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : 'Nunca'}
                          </TableCell>
                          <TableCell>
                            {job.next_run_at
                              ? format(new Date(job.next_run_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExecuteBackup(job.id)}
                                disabled={!job.enabled}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleJob(job.id, job.enabled)}
                              >
                                {job.enabled ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Histórico */}
          <TabsContent value="executions">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
              </CardHeader>
              <CardContent>
                {executions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma execução de backup registrada
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executions.map((exec) => (
                        <TableRow key={exec.id}>
                          <TableCell>
                            {format(new Date(exec.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {exec.backup_type === 'full' && 'Completo'}
                            {exec.backup_type === 'incremental' && 'Incremental'}
                            {exec.backup_type === 'differential' && 'Diferencial'}
                          </TableCell>
                          <TableCell>{getStatusBadge(exec.status)}</TableCell>
                          <TableCell>
                            {exec.file_size_mb ? `${exec.file_size_mb.toFixed(2)} MB` : '-'}
                          </TableCell>
                          <TableCell>
                            {exec.duration_seconds
                              ? `${Math.floor(exec.duration_seconds / 60)}m ${exec.duration_seconds % 60}s`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {exec.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackup(exec);
                                  setRestoreDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restaurar
                              </Button>
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

          {/* Aba: Restaurações */}
          <TabsContent value="restore">
            <Card>
              <CardHeader>
                <CardTitle>Operações de Restauração</CardTitle>
              </CardHeader>
              <CardContent>
                {restoreOperations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma operação de restauração registrada
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Verificado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restoreOperations.map((op) => (
                        <TableRow key={op.id}>
                          <TableCell>
                            {format(new Date(op.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {op.restore_type === 'full' && 'Completa'}
                            {op.restore_type === 'partial' && 'Parcial'}
                            {op.restore_type === 'table' && 'Tabela'}
                          </TableCell>
                          <TableCell>{getStatusBadge(op.status)}</TableCell>
                          <TableCell>
                            {op.duration_seconds
                              ? `${Math.floor(op.duration_seconds / 60)}m ${op.duration_seconds % 60}s`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={op.verified ? 'default' : 'secondary'}>
                              {op.verified ? 'Sim' : 'Não'}
                            </Badge>
                          </TableCell>
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

      {/* Dialog: Criar Job */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Job de Backup</DialogTitle>
            <DialogDescription>
              Configure um novo job de backup automático
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="jobName">Nome do Job *</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Ex: Backup Diário Principal"
                required
              />
            </div>

            <div>
              <Label htmlFor="scheduleType">Tipo de Agendamento *</Label>
              <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                <SelectTrigger id="scheduleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType !== 'manual' && (
              <div>
                <Label htmlFor="scheduleTime">Horário</Label>
                <Input
                  id="scheduleTime"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="backupType">Tipo de Backup *</Label>
              <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                <SelectTrigger id="backupType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Completo</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="differential">Diferencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="retentionDays">Retenção (dias) *</Label>
              <Input
                id="retentionDays"
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                min="1"
                max="365"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateJob}>
                Criar Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Restaurar */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              {selectedBackup && (
                <>
                  Restaurar backup de {format(new Date(selectedBackup.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  {selectedBackup.file_size_mb && ` (${selectedBackup.file_size_mb.toFixed(2)} MB)`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Atenção:</strong> Esta operação irá restaurar os dados do backup selecionado.
                  Certifique-se de que este é o backup correto antes de continuar.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setRestoreDialogOpen(false);
                  setSelectedBackup(null);
                }}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRestore(selectedBackup)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirmar Restauração
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



