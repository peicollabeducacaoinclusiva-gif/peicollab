import { describe, it, expect, beforeEach, vi } from 'vitest';
import { backupService, type BackupJob, type BackupExecution } from '../backupService';
import { supabase } from '@pei/database';

// Mock do Supabase
vi.mock('@pei/database', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('backupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBackupJobs', () => {
    it('deve retornar lista de jobs de backup', async () => {
      const mockJobs: BackupJob[] = [
        {
          id: 'job-1',
          job_name: 'Backup Diário',
          schedule_type: 'daily',
          backup_type: 'full',
          retention_days: 30,
          enabled: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
      });

      const result = await backupService.getBackupJobs('tenant-1');
      expect(result).toEqual(mockJobs);
    });

    it('deve filtrar por tenantId quando fornecido', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue(queryBuilder);

      await backupService.getBackupJobs('tenant-1');

      expect(queryBuilder.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    });
  });

  describe('createBackupJob', () => {
    it('deve criar job de backup com dados válidos', async () => {
      const newJob: Partial<BackupJob> = {
        tenant_id: 'tenant-1',
        job_name: 'Backup Teste',
        schedule_type: 'daily',
        backup_type: 'full',
        retention_days: 30,
        enabled: true,
      };

      const createdJob: BackupJob = {
        ...newJob,
        id: 'job-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      } as BackupJob;

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdJob, error: null }),
      });

      (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

      const result = await backupService.createBackupJob(newJob);
      expect(result.job_name).toBe('Backup Teste');
      expect(result.id).toBe('job-1');
    });

    it('deve lançar erro se job_name não for fornecido', async () => {
      const invalidJob: Partial<BackupJob> = {
        schedule_type: 'daily',
        backup_type: 'full',
      };

      await expect(backupService.createBackupJob(invalidJob)).rejects.toThrow();
    });
  });

  describe('executeBackup', () => {
    it('deve executar backup e retornar execução', async () => {
      const mockExecution: BackupExecution = {
        id: 'exec-1',
        backup_job_id: 'job-1',
        status: 'completed',
        backup_type: 'full',
        started_at: '2025-01-01T00:00:00Z',
        file_path: '/backups/backup-1.sql',
        file_size_bytes: 1024000,
      };

      (supabase.rpc as any).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockExecution, error: null }),
      });

      const result = await backupService.executeBackup('job-1');
      expect(result.id).toBe('exec-1');
      expect(result.status).toBe('completed');
    });

    it('deve lançar erro se execução falhar', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: { success: false, error: 'Erro ao executar backup' },
        error: null,
      });

      await expect(backupService.executeBackup('job-1')).rejects.toThrow();
    });
  });

  describe('verifyBackup', () => {
    it('deve retornar true para backup válido', async () => {
      const mockExecution = {
        id: 'exec-1',
        status: 'completed',
        file_path: '/backups/backup-1.sql',
        file_size_bytes: 1024000,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockExecution, error: null }),
      });

      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { checksum_md5: 'abc123' },
          error: null,
        }),
      });

      const result = await backupService.verifyBackup('exec-1');
      expect(result).toBe(true);
    });

    it('deve retornar false para backup inválido', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { status: 'failed' },
          error: null,
        }),
      });

      const result = await backupService.verifyBackup('exec-1');
      expect(result).toBe(false);
    });
  });

  describe('getBackupExecutions', () => {
    it('deve filtrar execuções por tenantId', async () => {
      const mockJobs = [{ id: 'job-1' }, { id: 'job-2' }];
      const mockExecutions: BackupExecution[] = [
        {
          id: 'exec-1',
          backup_job_id: 'job-1',
          status: 'completed',
          backup_type: 'full',
          started_at: '2025-01-01T00:00:00Z',
        },
      ];

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockExecutions, error: null }),
        });

      const result = await backupService.getBackupExecutions(undefined, 'tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('exec-1');
    });
  });
});
