import { ssoManager, SSOManager } from '@pei/auth';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

/**
 * Serviço SSO para o app Landing
 * Gerencia autenticação e compartilhamento de sessão entre apps
 */
export const ssoService = {
  /**
   * Realiza login e salva sessão para SSO
   */
  async signIn(email: string, password: string): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { session: null, error };
      }

      if (data.session) {
        // Salvar sessão para SSO
        await ssoManager.saveSession(data.session, 'landing');
        return { session: data.session, error: null };
      }

      return { session: null, error: new Error('Sessão não retornada') };
    } catch (error) {
      return { session: null, error: error instanceof Error ? error : new Error('Erro desconhecido') };
    }
  },

  /**
   * Realiza logout e limpa sessão SSO
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      ssoManager.clearSession();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Limpar sessão mesmo em caso de erro
      ssoManager.clearSession();
    }
  },

  /**
   * Restaura sessão SSO se existir
   */
  async restoreSession(): Promise<Session | null> {
    try {
      return await ssoManager.restoreSession();
    } catch (error) {
      console.error('Erro ao restaurar sessão SSO:', error);
      return null;
    }
  },

  /**
   * Verifica se há sessão SSO ativa
   */
  async hasActiveSession(): Promise<boolean> {
    try {
      const session = await ssoManager.getSession();
      return session !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtém informações sobre o domínio e disponibilidade de SSO
   */
  getSSOInfo(): {
    available: boolean;
    baseDomain: string;
    hostname: string;
    isLocalhost: boolean;
  } {
    const domainInfo = ssoManager.getDomainInfo();
    return {
      available: ssoManager.isSSOAvailable(),
      ...domainInfo,
    };
  },

  /**
   * Navega para outro app mantendo sessão SSO
   */
  navigateToApp(appUrl: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = appUrl;
    }
  },
};

