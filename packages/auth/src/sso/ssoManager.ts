import { supabase } from '@pei/database';
import type { Session } from '@supabase/supabase-js';
import { setCookie, getCookie, removeCookie, getBaseDomain } from './cookieManager';
import { saveAuthToken, getAuthToken, clearAuthToken } from '../hooks/useAuthToken';

const SSO_COOKIE_NAME = 'pei-sso-session';
const SSO_REFRESH_COOKIE_NAME = 'pei-sso-refresh';
const SSO_TOKEN_KEY = '@pei-collab:sso-token';

export interface SSOSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  tenant_id?: string;
  app_name?: string;
}

/**
 * Gerenciador de SSO para compartilhamento de sessão entre apps
 */
export class SSOManager {
  private static instance: SSOManager | null = null;

  static getInstance(): SSOManager {
    if (!SSOManager.instance) {
      SSOManager.instance = new SSOManager();
    }
    return SSOManager.instance;
  }

  /**
   * Salva sessão para SSO entre apps
   * Usa cookies para compartilhamento entre subdomínios e localStorage como fallback
   */
  async saveSession(session: Session | null, appName?: string): Promise<void> {
    if (!session) {
      this.clearSession();
      return;
    }

    const ssoSession: SSOSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || 0,
      user_id: session.user.id,
      app_name: appName,
    };

    // Salvar em cookie para compartilhamento entre subdomínios
    try {
      const expiresAt = session.expires_at 
        ? new Date(session.expires_at * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias padrão

      setCookie(SSO_COOKIE_NAME, JSON.stringify(ssoSession), {
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        expires: expiresAt,
        secure: window.location.protocol === 'https:',
        sameSite: 'lax',
      });

      // Salvar refresh token separadamente (mais longo)
      setCookie(SSO_REFRESH_COOKIE_NAME, session.refresh_token, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        secure: window.location.protocol === 'https:',
        sameSite: 'lax',
      });
    } catch (error) {
      console.warn('Erro ao salvar cookie SSO, usando localStorage como fallback:', error);
    }

    // Salvar também em localStorage como fallback
    try {
      localStorage.setItem(SSO_TOKEN_KEY, JSON.stringify(ssoSession));
      saveAuthToken(session); // Manter compatibilidade com código existente
    } catch (error) {
      console.error('Erro ao salvar token SSO no localStorage:', error);
    }
  }

  /**
   * Recupera sessão SSO
   * Tenta cookie primeiro, depois localStorage
   */
  async getSession(): Promise<SSOSession | null> {
    // Tentar cookie primeiro
    try {
      const cookieSession = getCookie(SSO_COOKIE_NAME);
      if (cookieSession) {
        const session = JSON.parse(cookieSession) as SSOSession;
        
        // Validar se não está expirado
        if (this.isSessionValid(session)) {
          return session;
        } else {
          // Tentar refresh se tiver refresh token
          const refreshToken = getCookie(SSO_REFRESH_COOKIE_NAME);
          if (refreshToken) {
            const refreshed = await this.refreshSession(refreshToken);
            if (refreshed) {
              return refreshed;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao ler cookie SSO:', error);
    }

    // Fallback para localStorage
    try {
      const stored = localStorage.getItem(SSO_TOKEN_KEY);
      if (stored) {
        const session = JSON.parse(stored) as SSOSession;
        if (this.isSessionValid(session)) {
          return session;
        }
      }

      // Tentar usar getAuthToken como fallback adicional
      const token = getAuthToken();
      if (token) {
        return {
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: token.expires_at,
          user_id: token.user_id,
        };
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão SSO do localStorage:', error);
    }

    return null;
  }

  /**
   * Restaura sessão SSO no Supabase
   */
  async restoreSession(): Promise<Session | null> {
    const ssoSession = await this.getSession();
    if (!ssoSession) {
      return null;
    }

    try {
      // Tentar usar refresh token para obter nova sessão
      const { data, error } = await supabase.auth.setSession({
        access_token: ssoSession.access_token,
        refresh_token: ssoSession.refresh_token,
      });

      if (error) {
        // Se access token expirou, tentar refresh
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          const refreshed = await this.refreshSession(ssoSession.refresh_token);
          if (refreshed) {
            return await this.restoreSession();
          }
        }
        throw error;
      }

      if (data.session) {
        // Salvar sessão atualizada
        await this.saveSession(data.session);
        return data.session;
      }

      return null;
    } catch (error) {
      console.error('Erro ao restaurar sessão SSO:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Atualiza sessão usando refresh token
   */
  async refreshSession(refreshToken?: string): Promise<SSOSession | null> {
    const token = refreshToken || getCookie(SSO_REFRESH_COOKIE_NAME) || null;
    
    if (!token) {
      return null;
    }

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: token,
      });

      if (error) {
        console.error('Erro ao fazer refresh da sessão:', error);
        this.clearSession();
        return null;
      }

      if (data.session) {
        await this.saveSession(data.session);
        return {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
          user_id: data.session.user.id,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro inesperado ao fazer refresh:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Limpa sessão SSO
   */
  clearSession(): void {
    // Remover cookies
    removeCookie(SSO_COOKIE_NAME);
    removeCookie(SSO_REFRESH_COOKIE_NAME);

    // Remover do localStorage
    try {
      localStorage.removeItem(SSO_TOKEN_KEY);
      clearAuthToken(); // Manter compatibilidade
    } catch (error) {
      console.error('Erro ao limpar token SSO do localStorage:', error);
    }
  }

  /**
   * Verifica se sessão é válida (não expirada)
   */
  private isSessionValid(session: SSOSession): boolean {
    if (!session.expires_at) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutos de buffer
    return session.expires_at > (now + bufferTime);
  }

  /**
   * Obtém informações sobre o domínio base para SSO
   */
  getDomainInfo(): { baseDomain: string; hostname: string; isLocalhost: boolean } {
    if (typeof window === 'undefined') {
      return { baseDomain: '', hostname: '', isLocalhost: false };
    }

    const hostname = window.location.hostname;
    const baseDomain = getBaseDomain();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    return { baseDomain, hostname, isLocalhost };
  }

  /**
   * Verifica se SSO está disponível (cookies habilitados e domínio válido)
   */
  isSSOAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const { isLocalhost, baseDomain } = this.getDomainInfo();
    
    // Em localhost, SSO funciona via localStorage
    if (isLocalhost) {
      return true;
    }

    // Em produção, precisa ter domínio base válido
    return baseDomain !== '';
  }
}

// Exportar instância singleton
export const ssoManager = SSOManager.getInstance();

