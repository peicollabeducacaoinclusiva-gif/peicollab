import { describe, it, expect, vi, beforeEach } from 'vitest';
import { peiVersioningService } from '../peiVersioningService';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('peiVersioningService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVersion', () => {
    it('deve criar nova versão com sucesso', async () => {
      const mockVersionId = 'version-123';
      mockSupabase.rpc.mockResolvedValue({
        data: mockVersionId,
        error: null,
      });

      const result = await peiVersioningService.createVersion({
        peiId: 'pei-1',
        changes: {
          diagnosis: { test: 'data' },
        },
        changeType: 'updated',
        changeSummary: 'Atualização de diagnóstico',
      });

      expect(result).toBe(mockVersionId);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_pei_version_with_diff', {
        p_pei_id: 'pei-1',
        p_changes: { diagnosis: { test: 'data' } },
        p_change_type: 'updated',
        p_change_summary: 'Atualização de diagnóstico',
      });
    });

    it('deve usar valores padrão quando não fornecidos', async () => {
      const mockVersionId = 'version-123';
      mockSupabase.rpc.mockResolvedValue({
        data: mockVersionId,
        error: null,
      });

      await peiVersioningService.createVersion({
        peiId: 'pei-1',
        changes: {},
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_pei_version_with_diff', {
        p_pei_id: 'pei-1',
        p_changes: {},
        p_change_type: 'updated',
        p_change_summary: '',
      });
    });

    it('deve lançar erro quando RPC falha', async () => {
      const mockError = { message: 'Erro ao criar versão' };
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        peiVersioningService.createVersion({
          peiId: 'pei-1',
          changes: {},
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('getVersions', () => {
    it('deve buscar todas as versões de um PEI', async () => {
      const mockVersions = [
        {
          id: 'v1',
          pei_id: 'pei-1',
          version_number: 1,
          changed_by: 'user-1',
          changed_by_user: { id: 'user-1', full_name: 'User 1' },
        },
        {
          id: 'v2',
          pei_id: 'pei-1',
          version_number: 2,
          changed_by: 'user-2',
          changed_by_user: { id: 'user-2', full_name: 'User 2' },
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockVersions,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await peiVersioningService.getVersions('pei-1');

      expect(result).toHaveLength(2);
      expect(result[0].version_number).toBe(1);
      expect(result[1].version_number).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('pei_history');
    });

    it('deve retornar array vazio quando não há versões', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await peiVersioningService.getVersions('pei-1');

      expect(result).toEqual([]);
    });

    it('deve lançar erro quando query falha', async () => {
      const mockError = { message: 'Erro ao buscar versões' };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(peiVersioningService.getVersions('pei-1')).rejects.toEqual(mockError);
    });
  });

  describe('getVersion', () => {
    it('deve buscar versão específica', async () => {
      const mockVersion = {
        id: 'v1',
        pei_id: 'pei-1',
        version_number: 1,
        changed_by: 'user-1',
        changed_by_user: { id: 'user-1', full_name: 'User 1' },
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockVersion,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await peiVersioningService.getVersion('pei-1', 1);

      expect(result.version_number).toBe(1);
      expect(result.changed_by_user).toEqual(mockVersion.changed_by_user);
    });
  });

  describe('getVersionDiff', () => {
    it('deve obter diff entre duas versões', async () => {
      const mockDiff = {
        diagnosis_changed: true,
        planning_changed: false,
        evaluation_changed: false,
        status_changed: false,
        version1: {
          diagnosis: {},
          planning: {},
          evaluation: {},
          status: 'draft',
        },
        version2: {
          diagnosis: { test: 'data' },
          planning: {},
          evaluation: {},
          status: 'draft',
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockDiff,
        error: null,
      });

      const result = await peiVersioningService.getVersionDiff('pei-1', 1, 2);

      expect(result).toEqual(mockDiff);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_pei_version_diff', {
        p_pei_id: 'pei-1',
        p_version1: 1,
        p_version2: 2,
      });
    });
  });

  describe('restoreVersion', () => {
    it('deve restaurar versão corretamente', async () => {
      const mockVersion = {
        id: 'v1',
        pei_id: 'pei-1',
        version_number: 1,
        diagnosis_data: { test: 'old' },
        planning_data: { goals: [] },
        evaluation_data: {},
        status: 'draft',
      };

      // Mock getVersion
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockVersion,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Mock createVersion
      mockSupabase.rpc.mockResolvedValue({
        data: 'new-version-id',
        error: null,
      });

      const result = await peiVersioningService.restoreVersion('pei-1', 1);

      expect(result).toBe('new-version-id');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_pei_version_with_diff', {
        p_pei_id: 'pei-1',
        p_changes: {
          diagnosis: mockVersion.diagnosis_data,
          planning: mockVersion.planning_data,
          evaluation: mockVersion.evaluation_data,
          status: mockVersion.status,
        },
        p_change_type: 'updated',
        p_change_summary: 'Restaurado da versão 1',
      });
    });
  });

  describe('createSnapshot', () => {
    it('deve criar snapshot completo do PEI', async () => {
      const mockUser = { id: 'user-1' };
      const mockPEI = {
        diagnosis_data: { test: 'data' },
        planning_data: { goals: [] },
        evaluation_data: {},
        status: 'approved',
        version_number: 2,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      // Mock get PEI
      const mockPEISelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPEI,
              error: null,
            }),
          }),
        }),
      });

      // Mock get last version
      const mockHistorySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { version_number: 2 },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock insert snapshot
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'snapshot-123' },
            error: null,
          }),
        }),
      });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockPEISelect }) // peis
        .mockReturnValueOnce({ select: mockHistorySelect }) // pei_history (select)
        .mockReturnValueOnce({ insert: mockInsert }); // pei_history (insert)

      const result = await peiVersioningService.createSnapshot('pei-1');

      expect(result).toBe('snapshot-123');
    });
  });
});

