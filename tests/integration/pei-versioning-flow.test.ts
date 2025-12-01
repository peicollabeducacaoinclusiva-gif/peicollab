import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePEIVersioning } from '@/hooks/usePEIVersioning';
import { peiVersioningService } from '@/services/peiVersioningService';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock do serviço
vi.mock('@/services/peiVersioningService', () => ({
  peiVersioningService: {
    createVersion: vi.fn(),
    getVersions: vi.fn(),
    getVersion: vi.fn(),
    restoreVersion: vi.fn(),
    getVersionDiff: vi.fn(),
    createSnapshot: vi.fn(),
  },
}));

describe('Fluxo de Versionamento de PEI - Integração', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
  });

  it('deve criar nova versão quando PEI é editado', async () => {
    const mockVersions = [
      {
        id: 'v1',
        version_number: 1,
        changed_at: '2025-01-01T00:00:00Z',
        change_type: 'created',
      },
    ];

    vi.mocked(peiVersioningService.getVersions).mockResolvedValue(mockVersions);
    vi.mocked(peiVersioningService.createVersion).mockResolvedValue('version-2');

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

    // Criar nova versão
    await result.current.createVersion({
      pei_id: 'pei-1',
      change_type: 'updated',
      change_summary: 'Atualização de diagnóstico',
      diagnosis_data: { test: 'new data' },
    });

    await waitFor(() => {
      expect(peiVersioningService.createVersion).toHaveBeenCalled();
    });
  });

  it('deve restaurar versão anterior', async () => {
    const mockVersions = [
      {
        id: 'v2',
        version_number: 2,
        changed_at: '2025-01-02T00:00:00Z',
        change_type: 'updated',
      },
      {
        id: 'v1',
        version_number: 1,
        changed_at: '2025-01-01T00:00:00Z',
        change_type: 'created',
      },
    ];

    vi.mocked(peiVersioningService.getVersions).mockResolvedValue(mockVersions);
    vi.mocked(peiVersioningService.restoreVersion).mockResolvedValue('version-3');

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

    // Restaurar versão 1
    await result.current.restoreVersion(mockVersions[1]);

    await waitFor(() => {
      expect(peiVersioningService.restoreVersion).toHaveBeenCalledWith({
        versionNumber: 1,
      });
    });
  });

  it('deve calcular diff entre versões', async () => {
    const mockVersions = [
      {
        id: 'v2',
        version_number: 2,
        changed_at: '2025-01-02T00:00:00Z',
      },
      {
        id: 'v1',
        version_number: 1,
        changed_at: '2025-01-01T00:00:00Z',
      },
    ];

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
        diagnosis: { test: 'new' },
        planning: {},
        evaluation: {},
        status: 'draft',
      },
    };

    vi.mocked(peiVersioningService.getVersions).mockResolvedValue(mockVersions);
    vi.mocked(peiVersioningService.getVersionDiff).mockResolvedValue(mockDiff);

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

    const changes = await result.current.getVersionDiff(mockVersions[1], mockVersions[0]);

    expect(changes).toContain('Diagnóstico');
    expect(peiVersioningService.getVersionDiff).toHaveBeenCalledWith('pei-1', 1, 2);
  });

  it('deve criar snapshot do PEI', async () => {
    const mockVersions = [
      {
        id: 'v1',
        version_number: 1,
        changed_at: '2025-01-01T00:00:00Z',
      },
    ];

    vi.mocked(peiVersioningService.getVersions).mockResolvedValue(mockVersions);
    vi.mocked(peiVersioningService.createSnapshot).mockResolvedValue('snapshot-1');

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

    await result.current.createSnapshot();

    await waitFor(() => {
      expect(peiVersioningService.createSnapshot).toHaveBeenCalledWith('pei-1');
    });
  });

  it('deve manter histórico completo de versões', async () => {
    const mockVersions = [
      {
        id: 'v3',
        version_number: 3,
        changed_at: '2025-01-03T00:00:00Z',
        change_type: 'updated',
      },
      {
        id: 'v2',
        version_number: 2,
        changed_at: '2025-01-02T00:00:00Z',
        change_type: 'updated',
      },
      {
        id: 'v1',
        version_number: 1,
        changed_at: '2025-01-01T00:00:00Z',
        change_type: 'created',
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

    expect(result.current.versions).toHaveLength(3);
    expect(result.current.activeVersion?.version_number).toBe(3);
  });
});

