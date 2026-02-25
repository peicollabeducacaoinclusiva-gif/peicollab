import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from './usePermissions';

const mockUnsubscribe = vi.fn();

function createMockSupabase(user: { id: string; user_metadata?: { role?: string } } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: { unsubscribe: mockUnsubscribe },
        },
      }),
    },
  };
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/client';

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe.mockClear();
  });

  it('retorna loading inicialmente', () => {
    vi.mocked(createClient).mockReturnValue(
      createMockSupabase(null) as ReturnType<typeof createClient>
    );
    const { result } = renderHook(() => usePermissions());
    expect(result.current.loading).toBe(true);
  });

  it('admin_rede tem canEditTemplate e canManageUsers', async () => {
    vi.mocked(createClient).mockReturnValue(
      createMockSupabase({
        id: '1',
        user_metadata: { role: 'admin_rede' },
      }) as ReturnType<typeof createClient>
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.canEditTemplate()).toBe(true);
    expect(result.current.canManageUsers()).toBe(true);
    expect(result.current.canCreateDocument()).toBe(true);
  });

  it('familia tem canFamilyComment e canFamilyAcknowledge, não canCreateDocument', async () => {
    vi.mocked(createClient).mockReturnValue(
      createMockSupabase({
        id: '1',
        user_metadata: { role: 'familia' },
      }) as ReturnType<typeof createClient>
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.canFamilyComment()).toBe(true);
    expect(result.current.canFamilyAcknowledge()).toBe(true);
    expect(result.current.canCreateDocument()).toBe(false);
    expect(result.current.canEditDocument()).toBe(false);
    expect(result.current.canApproveDocument()).toBe(false);
  });

  it('usuário sem role retorna permissões negativas', async () => {
    vi.mocked(createClient).mockReturnValue(
      createMockSupabase({ id: '1', user_metadata: {} }) as ReturnType<typeof createClient>
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.canCreateDocument()).toBe(false);
    expect(result.current.canEditTemplate()).toBe(false);
  });

  it('sem usuário autenticado retorna permissões negativas', async () => {
    vi.mocked(createClient).mockReturnValue(
      createMockSupabase(null) as ReturnType<typeof createClient>
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.canCreateDocument()).toBe(false);
    expect(result.current.canManageUsers()).toBe(false);
  });
});
