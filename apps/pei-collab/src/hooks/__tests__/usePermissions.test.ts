import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar permissões quando usuário está autenticado', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockPrimaryRole = 'teacher';
    const mockTenantId = 'tenant-1';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: mockPrimaryRole }) // get_user_primary_role
      .mockResolvedValueOnce({ data: mockTenantId }) // get_user_tenant_safe
      .mockResolvedValueOnce({ data: false }) // can_manage_network
      .mockResolvedValueOnce({ data: 'school-1' }); // get_user_school_id

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.primaryRole).toBe(mockPrimaryRole);
    expect(result.current.canManageNetwork).toBe(false);
    expect(result.current.canManageSchool).toBe(false);
  });

  it('deve retornar erro quando usuário não está autenticado', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Usuário não autenticado');
    expect(result.current.primaryRole).toBeNull();
  });

  it('deve verificar acesso ao PEI corretamente', async () => {
    const mockUser = { id: 'user-1' };
    const mockPrimaryRole = 'teacher';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: mockPrimaryRole })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ data: 'school-1' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock para verificação de acesso ao PEI
    mockSupabase.rpc.mockResolvedValueOnce({ data: true });

    const hasAccess = await result.current.canAccessPEI('pei-1');

    expect(hasAccess).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('user_can_access_pei', {
      _user_id: mockUser.id,
      _pei_id: 'pei-1',
    });
  });

  it('deve verificar role corretamente', async () => {
    const mockUser = { id: 'user-1' };
    const mockPrimaryRole = 'coordinator';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: mockPrimaryRole })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ data: 'school-1' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock para verificação de role
    mockSupabase.rpc.mockResolvedValueOnce({ data: true });

    const hasRole = await result.current.hasRole('coordinator');

    expect(hasRole).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('has_role', {
      _user_id: mockUser.id,
      _role: 'coordinator',
    });
  });

  it('deve permitir superadmin gerenciar qualquer usuário', async () => {
    const mockUser = { id: 'user-1' };
    const mockPrimaryRole = 'superadmin';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: mockPrimaryRole })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: true })
      .mockResolvedValueOnce({ data: 'school-1' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const canManage = await result.current.canManageUser('any-user-id');

    expect(canManage).toBe(true);
  });

  it('deve recarregar permissões quando refresh é chamado', async () => {
    const mockUser = { id: 'user-1' };
    const mockPrimaryRole = 'teacher';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: mockPrimaryRole })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ data: 'school-1' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Resetar mocks
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: 'coordinator' })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ data: 'school-1' });

    result.current.refresh();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.primaryRole).toBe('coordinator');
  });
});

