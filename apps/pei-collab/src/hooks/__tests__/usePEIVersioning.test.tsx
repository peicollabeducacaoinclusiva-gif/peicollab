import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { usePEIVersioning } from '../usePEIVersioning';
import { peiVersioningService } from '@/services/peiVersioningService';
import { createTestQueryClient, TestWrapper } from '@/test/setup';

// Mock do serviço
vi.mock('@/services/peiVersioningService', () => ({
  peiVersioningService: {
    getVersions: vi.fn(),
    createVersion: vi.fn(),
    restoreVersion: vi.fn(),
    createSnapshot: vi.fn(),
    getVersionDiff: vi.fn(),
  },
}));

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
  },
}));

describe('usePEIVersioning', () => {
  const queryClient = createTestQueryClient();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('deve carregar versões do PEI', async () => {
    const mockVersions = [
      {
        id: 'version-1',
        pei_id: 'pei-1',
        version_number: 1,
        changed_by: 'user-1',
        changed_at: '2025-01-01T00:00:00Z',
        change_type: 'created',
        change_summary: 'Versão inicial',
      },
    ];

    vi.mocked(peiVersioningService.getVersions).mockResolvedValue(mockVersions);

    const { result } = renderHook(() => usePEIVersioning('pei-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.versions).toEqual(mockVersions);
    expect(result.current.activeVersion).toEqual(mockVersions[0]);
  });

  it('não deve carregar versões quando peiId é null', () => {
    const { result } = renderHook(() => usePEIVersioning(null), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    expect(result.current.versions).toEqual([]);
    expect(peiVersioningService.getVersions).not.toHaveBeenCalled();
  });

  it('deve criar nova versão corretamente', async () => {
    const mockVersionId = 'new-version-id';
    vi.mocked(peiVersioningService.createVersion).mockResolvedValue(mockVersionId);
    vi.mocked(peiVersioningService.getVersions).mockResolvedValue([]);

    const { result } = renderHook(() => usePEIVersioning('pei-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const versionData = {
      pei_id: 'pei-1',
      change_type: 'updated' as const,
      change_summary: 'Atualização de diagnóstico',
      diagnosis_data: { test: 'data' },
    };

    await result.current.createVersion(versionData);

    expect(peiVersioningService.createVersion).toHaveBeenCalledWith({
      peiId: 'pei-1',
      changes: {
        diagnosis: { test: 'data' },
        planning: undefined,
        evaluation: undefined,
        status: undefined,
      },
      changeType: 'updated',
      changeSummary: 'Atualização de diagnóstico',
    });
  });

  it('deve restaurar versão corretamente', async () => {
    const mockVersion = {
      id: 'version-1',
      pei_id: 'pei-1',
      version_number: 1,
      changed_by: 'user-1',
      changed_at: '2025-01-01T00:00:00Z',
      change_type: 'created',
      change_summary: 'Versão inicial',
    };

    vi.mocked(peiVersioningService.getVersions).mockResolvedValue([mockVersion]);
    vi.mocked(peiVersioningService.restoreVersion).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePEIVersioning('pei-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.restoreVersion(mockVersion);

    expect(peiVersioningService.restoreVersion).toHaveBeenCalledWith({
      versionNumber: 1,
    });
  });

  it('deve calcular diff entre versões', async () => {
    const mockDiff = {
      diagnosis_changed: true,
      planning_changed: false,
      evaluation_changed: false,
      status_changed: false,
      version1: { diagnosis: {}, planning: {}, evaluation: {}, status: 'draft' },
      version2: { diagnosis: { test: 'data' }, planning: {}, evaluation: {}, status: 'draft' },
    };

    vi.mocked(peiVersioningService.getVersionDiff).mockResolvedValue(mockDiff);
    vi.mocked(peiVersioningService.getVersions).mockResolvedValue([]);

    const { result } = renderHook(() => usePEIVersioning('pei-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const version1 = {
      id: 'v1',
      pei_id: 'pei-1',
      version_number: 1,
      changed_by: 'user-1',
      changed_at: '2025-01-01T00:00:00Z',
      change_type: 'created',
      change_summary: '',
    };

    const version2 = {
      id: 'v2',
      pei_id: 'pei-1',
      version_number: 2,
      changed_by: 'user-1',
      changed_at: '2025-01-02T00:00:00Z',
      change_type: 'updated',
      change_summary: '',
    };

    const changes = await result.current.getVersionDiff(version1, version2);

    expect(changes).toContain('Diagnóstico');
    expect(peiVersioningService.getVersionDiff).toHaveBeenCalledWith('pei-1', 1, 2);
  });
});

