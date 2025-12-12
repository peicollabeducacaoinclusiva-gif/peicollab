import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditService, type AuditLog, type AccessLog } from '../auditService';
import { supabase } from '@pei/database';

// Mock do Supabase
vi.mock('@pei/database', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAccess', () => {
    it('deve registrar log de acesso com sucesso', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: 'log-id-1',
        error: null,
      });

      const result = await auditService.logAccess('VIEW_STUDENT', 'student', 'student-1');
      expect(result).toBe('log-id-1');
      expect(supabase.rpc).toHaveBeenCalledWith('log_access', expect.any(Object));
    });

    it('deve retornar string vazia em caso de erro', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Erro ao registrar log' },
      });

      const result = await auditService.logAccess('VIEW_STUDENT');
      expect(result).toBe('');
    });
  });

  describe('getAuditLogs', () => {
    it('deve buscar logs de auditoria com filtros', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          tenant_id: 'tenant-1',
          actor_id: 'user-1',
          actor_name: 'João Silva',
          entity_type: 'student',
          entity_id: 'student-1',
          action: 'UPDATE',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { tenant_id: 'tenant-1' },
          error: null,
        }),
      });

      (supabase.rpc as any).mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const result = await auditService.getAuditLogs({
        tableName: 'students',
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].table_name).toBe('student');
      expect(result[0].action).toBe('UPDATE');
    });

    it('deve lançar erro se tenantId não for encontrado', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        auditService.getAuditLogs({
          tableName: 'students',
        })
      ).rejects.toThrow('tenantId é obrigatório');
    });
  });

  describe('getUserAccessLogs', () => {
    it('deve buscar logs de acesso do usuário com tenantId', async () => {
      const mockTrail = [
        {
          id: 'log-1',
          tenant_id: 'tenant-1',
          actor_id: 'user-1',
          entity_type: 'student',
          entity_id: 'student-1',
          action: 'READ',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockTrail,
        error: null,
      });

      const result = await auditService.getUserAccessLogs('user-1', 100, 'tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
      expect(result[0].action).toBe('READ');
    });

    it('deve usar fallback para get_user_access_logs quando tenantId não fornecido', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-1',
          action: 'VIEW',
          resource: 'dashboard',
          success: true,
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const result = await auditService.getUserAccessLogs('user-1', 100);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
    });
  });

  describe('exportAuditLogs', () => {
    it('deve exportar logs em formato CSV', async () => {
      const mockLogs: AuditLog[] = [
        {
          id: 'log-1',
          table_name: 'students',
          record_id: 'student-1',
          action: 'UPDATE',
          changed_by: 'user-1',
          changed_at: '2025-01-01T00:00:00Z',
        },
      ];

      // Mock getAuditLogs
      vi.spyOn(auditService, 'getAuditLogs').mockResolvedValue(mockLogs);

      const csv = await auditService.exportAuditLogs({
        tableName: 'students',
      });

      expect(csv).toContain('ID');
      expect(csv).toContain('Tabela');
      expect(csv).toContain('Registro');
      expect(csv).toContain('Ação');
      expect(csv).toContain('log-1');
      expect(csv).toContain('students');
    });
  });
});
