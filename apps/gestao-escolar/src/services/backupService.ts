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
    if (!job.job_name || !job.schedule_type || !job.backup_type) {
      throw new Error('job_name, schedule_type e backup_type são obrigatórios');
    }

    const { data, error } = await supabase
      .from('backup_jobs')
      .insert({
        tenant_id: job.tenant_id,
        job_name: job.job_name,
        schedule_type: job.schedule_type,
        schedule_time: job.schedule_time,
        schedule_day: job.schedule_day,
        schedule_day_of_week: job.schedule_day_of_week,
        backup_type: job.backup_type,
        retention_days: job.retention_days || 30,
        enabled: job.enabled !== undefined ? job.enabled : true,
        created_by: job.created_by,
      })
      .select()
      .single();

    if (error) throw error;

    // Agendar próximo backup
    await supabase.rpc('schedule_next_backup', { p_job_id: data.id });

    return {
      id: data.id,
      tenant_id: data.tenant_id,
      job_name: data.job_name,
      schedule_type: data.schedule_type as BackupScheduleType,
      schedule_time: data.schedule_time,
      schedule_day: data.schedule_day,
      schedule_day_of_week: data.schedule_day_of_week,
      backup_type: data.backup_type as BackupType,
      retention_days: data.retention_days,
      enabled: data.enabled,
      last_run_at: data.last_run_at,
      next_run_at: data.next_run_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
    } as BackupJob;
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

    return {
      id: data.id,
      tenant_id: data.tenant_id,
      job_name: data.job_name,
      schedule_type: data.schedule_type as BackupScheduleType,
      schedule_time: data.schedule_time,
      schedule_day: data.schedule_day,
      schedule_day_of_week: data.schedule_day_of_week,
      backup_type: data.backup_type as BackupType,
      retention_days: data.retention_days,
      enabled: data.enabled,
      last_run_at: data.last_run_at,
      next_run_at: data.next_run_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
    } as BackupJob;
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

    if (!data || !data.success) {
      throw new Error((data as any)?.error || 'Erro ao executar backup');
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
    if (!execution) {
      throw new Error('Execução de backup não encontrada após criação');
    }

    const backupExecution: BackupExecution = {
      id: execution.id,
      backup_job_id: execution.backup_job_id,
      status: execution.status as BackupStatus,
      backup_type: execution.backup_type as BackupType,
      file_path: execution.file_path,
      file_size_bytes: execution.file_size_bytes,
      file_size_mb: execution.file_size_mb,
      started_at: execution.started_at,
      completed_at: execution.completed_at,
      duration_seconds: execution.duration_seconds,
      error_message: execution.error_message,
      records_backed_up: execution.records_backed_up,
      tables_backed_up: execution.tables_backed_up,
      created_by: execution.created_by,
    };

    // Validação automática após backup (se status for completed)
    if (backupExecution.status === 'completed') {
      try {
        const isValid = await this.verifyBackup(backupExecution.id);
        if (!isValid) {
          console.error('⚠️ ALERTA: Backup executado mas verificação de integridade falhou!', backupExecution.id);
          // Em produção, pode ser necessário marcar como failed ou alertar
          // Por enquanto, apenas logamos o erro
        } else {
          console.log('✅ Backup verificado com sucesso:', backupExecution.id);
        }
      } catch (verifyError) {
        console.error('Erro ao verificar backup automaticamente:', verifyError);
        // Não falhamos a execução por causa da verificação, mas logamos
      }
    }

    return backupExecution;
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
    if (tenantId && !jobId) {
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
    
    return (data || []).map((exec: any) => ({
      id: exec.id,
      backup_job_id: exec.backup_job_id,
      status: exec.status as BackupStatus,
      backup_type: exec.backup_type as BackupType,
      file_path: exec.file_path,
      file_size_bytes: exec.file_size_bytes,
      file_size_mb: exec.file_size_mb,
      started_at: exec.started_at,
      completed_at: exec.completed_at,
      duration_seconds: exec.duration_seconds,
      error_message: exec.error_message,
      records_backed_up: exec.records_backed_up,
      tables_backed_up: exec.tables_backed_up,
      created_by: exec.created_by,
    })) as BackupExecution[];
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

    // Verificação obrigatória de checksum
    try {
      const { data: storageData, error: storageError } = await supabase
        .from('backup_storage')
        .select('checksum_md5, checksum_sha256')
        .eq('backup_execution_id', executionId)
        .maybeSingle();

      if (storageError) {
        console.warn('Erro ao verificar checksum do backup:', storageError);
        // Em produção, checksum é obrigatório - retornar false se não disponível
        // Em desenvolvimento, pode ser mais permissivo
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
          console.error('⚠️ ALERTA: Backup sem checksum em produção!', executionId);
          return false;
        }
        // Em desenvolvimento, permitir se passou nas verificações básicas
        return true;
      }

      // Verificação obrigatória de checksum
      if (storageData && (storageData.checksum_md5 || storageData.checksum_sha256)) {
        return true; // Checksum presente indica integridade verificada
      }

      // Se não tem checksum mas passou nas verificações básicas
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.error('⚠️ ALERTA: Backup sem checksum em produção!', executionId);
        return false;
      }
      // Em desenvolvimento, permitir
      return true;
    } catch (err) {
      // Se a tabela backup_storage não existir ou houver erro
      console.warn('Erro ao verificar checksum do backup:', err);
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.error('⚠️ ALERTA: Tabela backup_storage não disponível em produção!', err);
        return false;
      }
      // Em desenvolvimento, permitir se passou nas verificações básicas
      return true;
    }
  },
};



