import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock do SSO Manager
vi.mock('@pei/auth', () => ({
  ssoManager: {
    restoreSession: vi.fn(),
  },
}));

describe('useAuth', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMock = vi.fn();
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: unsubscribeMock,
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('deve inicializar com loading true', () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('deve carregar usuário quando há sessão', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('deve retornar null quando não há sessão', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('deve tratar erro ao obter sessão', async () => {
    const mockError = { message: 'Erro ao obter sessão' };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError.message);
    expect(result.current.user).toBeNull();
  });

  it('deve fazer login com sucesso', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { user: mockUser } },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const loginResult = await result.current.signIn('test@example.com', 'password123');

    expect(loginResult.success).toBe(true);
    expect(loginResult.user).toEqual(mockUser);
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('deve tratar erro no login', async () => {
    const mockError = { message: 'Credenciais inválidas' };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const loginResult = await result.current.signIn('test@example.com', 'wrong');

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe(mockError.message);
  });

  it('deve fazer logout com sucesso', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.signOut();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('deve tratar erro no logout', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    const mockError = { message: 'Erro ao fazer logout' };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    mockSupabase.auth.signOut.mockResolvedValue({
      error: mockError,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.signOut();

    await waitFor(() => {
      expect(result.current.error).toBe(mockError.message);
    });
  });

  it('deve fazer cadastro com sucesso', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'new@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signUpResult = await result.current.signUp('new@example.com', 'password123', {
      full_name: 'New User',
    });

    expect(signUpResult.success).toBe(true);
    expect(signUpResult.user).toEqual(mockUser);
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      options: {
        data: { full_name: 'New User' },
      },
    });
  });

  it('deve escutar mudanças no estado de autenticação', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simular mudança de estado
    const onChangeCallback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];
    onChangeCallback('SIGNED_IN', { user: mockUser } as any);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('deve fazer cleanup ao desmontar', () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});

