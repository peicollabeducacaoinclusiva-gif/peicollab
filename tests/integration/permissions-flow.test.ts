import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';
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

describe('Fluxo de Permissões - Integração', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve verificar permissões completas de um professor', async () => {
    const mockUser = { id: 'user-1', email: 'teacher@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: 'teacher' }) // get_user_primary_role
      .mockResolvedValueOnce({ data: 'tenant-1' }) // get_user_tenant_safe
      .mockResolvedValueOnce({ data: false }) // can_manage_network
      .mockResolvedValueOnce({ data: 'school-1' }); // get_user_school_id

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.primaryRole).toBe('teacher');
    expect(result.current.canManageNetwork).toBe(false);
    expect(result.current.canManageSchool).toBe(false);
  });

  it('deve verificar acesso a PEI específico', async () => {
    const mockUser = { id: 'user-1' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: 'teacher' })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ data: 'school-1' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verificar acesso ao PEI
    mockSupabase.rpc.mockResolvedValueOnce({ data: true });

    const hasAccess = await result.current.canAccessPEI('pei-1');

    expect(hasAccess).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('user_can_access_pei', {
      _user_id: mockUser.id,
      _pei_id: 'pei-1',
    });
  });

  it('deve verificar permissões de superadmin', async () => {
    const mockUser = { id: 'admin-1' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: 'superadmin' })
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: true })
      .mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.primaryRole).toBe('superadmin');
    expect(result.current.canManageNetwork).toBe(true);
    expect(result.current.canManageSchool).toBe(true);

    // Superadmin pode gerenciar qualquer usuário
    const canManage = await result.current.canManageUser('any-user-id');
    expect(canManage).toBe(true);
  });

  it('deve verificar múltiplas roles', async () => {
    const mockUser = { id: 'user-1' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: 'coordinator' })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: true })
      .mockResolvedValueOnce({ data: 'school-1' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verificar role específica
    mockSupabase.rpc.mockResolvedValueOnce({ data: true });
    const hasCoordinatorRole = await result.current.hasRole('coordinator');
    expect(hasCoordinatorRole).toBe(true);

    mockSupabase.rpc.mockResolvedValueOnce({ data: false });
    const hasTeacherRole = await result.current.hasRole('teacher');
    expect(hasTeacherRole).toBe(false);
  });

  it('deve recarregar permissões quando refresh é chamado', async () => {
    const mockUser = { id: 'user-1' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({ data: 'teacher' })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ data: 'school-1' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.primaryRole).toBe('teacher');

    // Resetar mocks e simular mudança de role
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: 'coordinator' })
      .mockResolvedValueOnce({ data: 'tenant-1' })
      .mockResolvedValueOnce({ data: true })
      .mockResolvedValueOnce({ data: 'school-1' });

    result.current.refresh();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.primaryRole).toBe('coordinator');
  });
});

