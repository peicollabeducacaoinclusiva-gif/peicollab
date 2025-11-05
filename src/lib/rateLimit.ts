/**
 * Sistema de Rate Limiting Client-Side
 * 
 * Protege contra ataques de força bruta e uso excessivo de recursos
 * NOTA: Esta é uma camada de proteção client-side. Idealmente deve ser
 * implementado também no servidor/Edge Functions.
 * 
 * @security Armazena tentativas em localStorage (pode ser limpo pelo usuário)
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const STORAGE_KEY_PREFIX = 'ratelimit_';

/**
 * Configurações padrão de rate limiting
 */
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 15 * 60 * 1000, // 15 minutos de bloqueio
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 60 * 60 * 1000, // 1 hora de bloqueio
  },
  familyToken: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueio
  },
  apiCall: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minuto
    blockDurationMs: 5 * 60 * 1000, // 5 minutos de bloqueio
  },
} as const;

/**
 * Classe principal de Rate Limiting
 */
export class RateLimiter {
  private key: string;
  private config: RateLimitConfig;

  constructor(identifier: string, config: RateLimitConfig) {
    this.key = `${STORAGE_KEY_PREFIX}${identifier}`;
    this.config = config;
  }

  /**
   * Obtém entry do localStorage
   */
  private getEntry(): RateLimitEntry | null {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Salva entry no localStorage
   */
  private setEntry(entry: RateLimitEntry): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(entry));
    } catch (error) {
      console.error('Erro ao salvar rate limit:', error);
    }
  }

  /**
   * Limpa entry do localStorage
   */
  private clearEntry(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error('Erro ao limpar rate limit:', error);
    }
  }

  /**
   * Verifica se está bloqueado
   */
  isBlocked(): { blocked: boolean; remainingTime?: number; message?: string } {
    const entry = this.getEntry();
    if (!entry) return { blocked: false };

    const now = Date.now();

    // Verifica se está explicitamente bloqueado
    if (entry.blockedUntil && entry.blockedUntil > now) {
      const remainingTime = entry.blockedUntil - now;
      const minutes = Math.ceil(remainingTime / 60000);
      return {
        blocked: true,
        remainingTime,
        message: `Muitas tentativas. Aguarde ${minutes} minuto(s) antes de tentar novamente.`,
      };
    }

    // Limpar bloqueio expirado
    if (entry.blockedUntil && entry.blockedUntil <= now) {
      this.clearEntry();
      return { blocked: false };
    }

    // Verificar se a janela de tempo expirou
    if (now - entry.firstAttempt > this.config.windowMs) {
      this.clearEntry();
      return { blocked: false };
    }

    return { blocked: false };
  }

  /**
   * Registra uma tentativa
   */
  attempt(): { allowed: boolean; remaining: number; message?: string } {
    // Verificar se está bloqueado
    const blockCheck = this.isBlocked();
    if (blockCheck.blocked) {
      return {
        allowed: false,
        remaining: 0,
        message: blockCheck.message,
      };
    }

    const now = Date.now();
    let entry = this.getEntry();

    if (!entry || now - entry.firstAttempt > this.config.windowMs) {
      // Nova janela de tempo
      entry = {
        attempts: 1,
        firstAttempt: now,
      };
      this.setEntry(entry);
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
      };
    }

    // Incrementar tentativas
    entry.attempts += 1;

    if (entry.attempts >= this.config.maxAttempts) {
      // Bloquear
      entry.blockedUntil = now + this.config.blockDurationMs;
      this.setEntry(entry);
      const minutes = Math.ceil(this.config.blockDurationMs / 60000);
      return {
        allowed: false,
        remaining: 0,
        message: `Limite de tentativas excedido. Aguarde ${minutes} minuto(s).`,
      };
    }

    this.setEntry(entry);
    return {
      allowed: true,
      remaining: this.config.maxAttempts - entry.attempts,
    };
  }

  /**
   * Reseta o rate limit (após sucesso)
   */
  reset(): void {
    this.clearEntry();
  }

  /**
   * Obtém informações atuais do rate limit
   */
  getInfo(): { attempts: number; remaining: number; blocked: boolean } {
    const blockCheck = this.isBlocked();
    if (blockCheck.blocked) {
      return { attempts: this.config.maxAttempts, remaining: 0, blocked: true };
    }

    const entry = this.getEntry();
    if (!entry) {
      return { attempts: 0, remaining: this.config.maxAttempts, blocked: false };
    }

    const now = Date.now();
    if (now - entry.firstAttempt > this.config.windowMs) {
      this.clearEntry();
      return { attempts: 0, remaining: this.config.maxAttempts, blocked: false };
    }

    return {
      attempts: entry.attempts,
      remaining: Math.max(0, this.config.maxAttempts - entry.attempts),
      blocked: false,
    };
  }
}

/**
 * Funções auxiliares para casos de uso comuns
 */

/**
 * Rate limiter para login
 */
export function createLoginRateLimiter(email: string): RateLimiter {
  // Usar email como identificador (ou hash se preferir)
  const identifier = `login_${email.toLowerCase()}`;
  return new RateLimiter(identifier, RATE_LIMIT_CONFIGS.login);
}

/**
 * Rate limiter para recuperação de senha
 */
export function createPasswordResetRateLimiter(email: string): RateLimiter {
  const identifier = `pwreset_${email.toLowerCase()}`;
  return new RateLimiter(identifier, RATE_LIMIT_CONFIGS.passwordReset);
}

/**
 * Rate limiter para tokens de família
 */
export function createFamilyTokenRateLimiter(clientInfo: string = 'unknown'): RateLimiter {
  // Usar IP ou fingerprint do cliente (simplificado aqui)
  const identifier = `family_${clientInfo}`;
  return new RateLimiter(identifier, RATE_LIMIT_CONFIGS.familyToken);
}

/**
 * Rate limiter genérico para API calls
 */
export function createAPIRateLimiter(endpoint: string, userId?: string): RateLimiter {
  const identifier = `api_${endpoint}_${userId || 'anon'}`;
  return new RateLimiter(identifier, RATE_LIMIT_CONFIGS.apiCall);
}

/**
 * Limpa todos os rate limits (útil para testes)
 */
export function clearAllRateLimits(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Erro ao limpar rate limits:', error);
  }
}

/**
 * Hook para facilitar uso em componentes React
 */
export function useRateLimit(identifier: string, config: RateLimitConfig) {
  const limiter = new RateLimiter(identifier, config);

  return {
    attempt: () => limiter.attempt(),
    reset: () => limiter.reset(),
    isBlocked: () => limiter.isBlocked(),
    getInfo: () => limiter.getInfo(),
  };
}

// Exportar configurações
export default {
  createLoginRateLimiter,
  createPasswordResetRateLimiter,
  createFamilyTokenRateLimiter,
  createAPIRateLimiter,
  clearAllRateLimits,
  RateLimiter,
  RATE_LIMIT_CONFIGS,
};

