import { describe, it, expect, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '@pei/test-utils';
import { ssoManager } from '@pei/auth';

/**
 * Testes de integração para fluxo SSO
 * Valida compartilhamento de sessão entre apps
 */

describe('SSO Flow Integration', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    // Limpar localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Compartilhamento de Sessão', () => {
    it('deve salvar sessão para SSO', async () => {
      const session = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'user-1' },
      };

      await ssoManager.saveSession(session as any, 'landing');

      const savedSession = await ssoManager.getSession();
      expect(savedSession).toBeDefined();
      expect(savedSession?.user_id).toBe('user-1');
    });

    it('deve restaurar sessão SSO em outro app', async () => {
      const session = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'user-1' },
      };

      // Salvar no app Landing
      await ssoManager.saveSession(session as any, 'landing');

      // Simular navegação para outro app
      const restoredSession = await ssoManager.restoreSession();
      expect(restoredSession).toBeDefined();
      expect(restoredSession?.user.id).toBe('user-1');
    });

    it('deve limpar sessão no logout', async () => {
      const session = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'user-1' },
      };

      await ssoManager.saveSession(session as any, 'landing');
      ssoManager.clearSession();

      const savedSession = await ssoManager.getSession();
      expect(savedSession).toBeNull();
    });
  });

  describe('Validação de Tokens', () => {
    it('deve detectar token expirado', async () => {
      const expiredSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) - 100, // Expirado
        user: { id: 'user-1' },
      };

      await ssoManager.saveSession(expiredSession as any, 'landing');
      const savedSession = await ssoManager.getSession();
      
      // Token expirado deve retornar null ou tentar refresh
      expect(savedSession).toBeNull();
    });
  });
});

