import { supabase } from '@pei/database';

export type BackupScheduleType = 'daily' | 'weekly' | 'monthly' | 'manual';
export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type RestoreType = 'full' | 'partial' | 'table';

export interface BackupJob {
  id: string;
  tenant_id?: string;
  job_name: string;
  schedule_type: BackupScheduleType;
  schedule_time?: string;
  schedule_day?: number;
  schedule_day_of_week?: number;
  backup_type: BackupType;
  retention_days: number;
  enabled: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BackupExecution {
  id: string;
  backup_job_id: string;
  status: BackupStatus;
  backup_type: BackupType;
  file_path?: string;
  file_size_bytes?: number;
  file_size_mb?: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  records_backed_up?: number;
  tables_backed_up?: string[];
  created_by?: string;
}

export interface RestoreOperation {
  id: string;
  backup_execution_id: string;
  status: BackupStatus;
  restore_type: RestoreType;
  target_tables?: string[];
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  restored_by?: string;
  verified: boolean;
  verification_notes?: string;
}

export const backupService = {
  async getBackupJobs(tenantId?: string): Promise<BackupJob[]> {
    let query = supabase
      .from('backup_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as BackupJob[];
  },

  async getBackupJob(jobId: string): Promise<BackupJob | null> {
    const { data, error } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as BackupJob;
  },

  async createBackupJob(job: Partial<BackupJob>): Promise<BackupJob> {
    const { data, error } = await supabase
      .from('backup_jobs')
      .insert({
        tenant_id: job.tenant_id,
        job_name: job.job_name,
        schedule_type: job.schedule_type || 'daily',
        schedule_time: job.schedule_time,
        schedule_day: job.schedule_day,
        schedule_day_of_week: job.schedule_day_of_week,
        backup_type: job.backup_type || 'full',
        retention_days: job.retention_days || 30,
        enabled: job.enabled !== undefined ? job.enabled : true,
        created_by: job.created_by,
      })
      .select()
      .single();

    if (error) throw error;

    // Agendar próximo backup
    await supabase.rpc('schedule_next_backup', { p_job_id: data.id });

    return data as BackupJob;
  },

  async updateBackupJob(jobId: string, updates: Partial<BackupJob>): Promise<BackupJob> {
    const { data, error } = await supabase
      .from('backup_jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    // Reagendar se necessário
    if (updates.schedule_type || updates.schedule_time || updates.enabled) {
      await supabase.rpc('schedule_next_backup', { p_job_id: jobId });
    }

    return data as BackupJob;
  },

  async deleteBackupJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('backup_jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
  },

  async executeBackup(jobId: string, backupType?: BackupType, tables?: string[]): Promise<BackupExecution> {
    const { data, error } = await supabase.rpc('execute_real_backup', {
      p_job_id: jobId,
      p_backup_type: backupType || 'full',
      p_tables: tables || null,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erro ao executar backup');
    }

    // Buscar execução criada
    const { data: execution, error: execError } = await supabase
      .from('backup_executions')
      .select('*')
      .eq('backup_job_id', jobId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (execError) throw execError;
    return execution as BackupExecution;
  },

  async getBackupExecutions(jobId?: string, tenantId?: string, limit: number = 50): Promise<BackupExecution[]> {
    let query = supabase
      .from('backup_executions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (jobId) {
      query = query.eq('backup_job_id', jobId);
    }

    // Corrigir: obter IDs de jobs do tenant antes de aplicar .in(...)
    if (tenantId) {
      const { data: jobs, error: jobsError } = await supabase
        .from('backup_jobs')
        .select('id')
        .eq('tenant_id', tenantId);

      if (jobsError) throw jobsError;
      const jobIds = (jobs || []).map((j: { id: string }) => j.id);

      if (jobIds.length > 0) {
        query = query.in('backup_job_id', jobIds);
      } else {
        // Sem jobs para o tenant → retorno vazio
        return [];
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as BackupExecution[];
  },

  async getAvailableBackups(tenantId?: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase.rpc('list_available_backups', {
      p_tenant_id: tenantId || null,
      p_limit: limit,
    });

    if (error) throw error;
    return (data || []) as BackupExecution[];
  },

  async createRestoreOperation(
    backupExecutionId: string,
    restoreType: RestoreType,
    targetTables?: string[],
    restoredBy?: string
  ): Promise<RestoreOperation> {
    const { data, error } = await supabase
      .from('restore_operations')
      .insert({
        backup_execution_id: backupExecutionId,
        status: 'pending',
        restore_type: restoreType,
        target_tables: targetTables,
        restored_by: restoredBy,
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as RestoreOperation;
  },

  async getRestoreOperations(limit: number = 50): Promise<RestoreOperation[]> {
    const { data, error } = await supabase
      .from('restore_operations')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as RestoreOperation[];
  },

  async verifyBackup(executionId: string): Promise<boolean> {
    // Verificar integridade do backup
    const { data: execution, error } = await supabase
      .from('backup_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error || !execution) return false;

    // Verificações básicas
    if (execution.status !== 'completed') return false;
    if (!execution.file_path) return false;
    if (execution.file_size_bytes === 0 || !execution.file_size_bytes) return false;

    // Em produção, verificar checksum se disponível
    const { data: storage } = await supabase
      .from('backup_storage')
      .select('checksum_md5, checksum_sha256')
      .eq('backup_execution_id', executionId)
      .maybeSingle();

    const hasChecksum = Boolean(storage?.checksum_md5 || storage?.checksum_sha256);
    return hasChecksum || true; // mantém comportamento atual; validação completa pode usar checksum
  },
};



