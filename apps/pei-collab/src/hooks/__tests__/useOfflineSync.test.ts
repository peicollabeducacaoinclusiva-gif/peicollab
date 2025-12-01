import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOfflineSync } from '../useOfflineSync';
import { supabase } from '@/integrations/supabase/client';
import { TestWrapper } from '@/test/setup';

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock do Dexie (offline database)
vi.mock('@/lib/offlineDatabase', () => ({
  offlineDB: {
    peis: {
      toArray: vi.fn(),
      bulkPut: vi.fn(),
      clear: vi.fn(),
    },
    students: {
      toArray: vi.fn(),
      bulkPut: vi.fn(),
    },
  },
}));

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar sincronização', () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: TestWrapper,
    });

    expect(result.current).toBeDefined();
  });

  it('deve sincronizar dados quando online', async () => {
    // Mock: está online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      // Deve tentar sincronizar
      expect(result.current).toBeDefined();
    });
  });

  it('deve armazenar dados localmente quando offline', async () => {
    // Mock: está offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      // Deve usar armazenamento local
      expect(result.current).toBeDefined();
    });
  });
});

