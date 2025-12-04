import { getLogger } from '../logging/logger';
import { errorReporter } from './errorReporter';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  appName?: string;
  tenantId?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Handler centralizado de erros
 * Captura e processa erros de forma consistente
 */
export class ErrorHandler {
  private logger = getLogger();
  private appName: string;

  constructor(appName: string) {
    this.appName = appName;
    this.setupGlobalErrorHandlers();
  }

  /**
   * Configura handlers globais de erro
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Handler para erros não capturados
    window.addEventListener('error', (event) => {
      this.handleError(
        event.error || new Error(event.message),
        {
          appName: this.appName,
          url: event.filename,
          metadata: {
            lineno: event.lineno,
            colno: event.colno,
            filename: event.filename,
          },
        }
      );
    });

    // Handler para promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          appName: this.appName,
          metadata: {
            type: 'unhandled_promise_rejection',
          },
        }
      );
    });
  }

  /**
   * Processa um erro
   */
  async handleError(
    error: Error | unknown,
    context?: ErrorContext
  ): Promise<void> {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const severity = this.determineSeverity(errorObj, context);

    // Log local
    this.logger.error(errorObj.message, errorObj, {
      app_name: context?.appName || this.appName,
      tenant_id: context?.tenantId,
      user_id: context?.userId,
      url: context?.url,
      severity,
      ...context?.metadata,
    });

    // Reportar para central de erros
    try {
      await errorReporter.reportError(
        context?.appName || this.appName,
        errorObj,
        {
          tenantId: context?.tenantId,
          userId: context?.userId,
          url: context?.url,
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress,
          metadata: context?.metadata,
          severity,
        }
      );
    } catch (reportError) {
      // Não lançar erro para não interromper o fluxo principal
      this.logger.warn('Erro ao reportar para central', { error: reportError });
    }
  }

  /**
   * Determina severidade do erro
   */
  private determineSeverity(error: Error, context?: ErrorContext): ErrorSeverity {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Erros críticos
    if (
      message.includes('critical') ||
      message.includes('fatal') ||
      message.includes('security') ||
      message.includes('unauthorized') ||
      stack.includes('security')
    ) {
      return 'critical';
    }

    // Erros altos
    if (
      message.includes('database') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('500')
    ) {
      return 'high';
    }

    // Erros médios
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('400') ||
      message.includes('404')
    ) {
      return 'medium';
    }

    // Erros baixos (padrão)
    return 'low';
  }

  /**
   * Wrapper para funções assíncronas
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: ErrorContext
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.handleError(error, context);
        throw error;
      }
    }) as T;
  }

  /**
   * Wrapper para funções síncronas
   */
  wrapSync<T extends (...args: any[]) => any>(
    fn: T,
    context?: ErrorContext
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(error, context);
        throw error;
      }
    }) as T;
  }
}

// Instância singleton
let errorHandlerInstance: ErrorHandler | null = null;

/**
 * Obtém instância singleton do ErrorHandler
 */
export function getErrorHandler(appName?: string): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler(
      appName || (typeof window !== 'undefined' ? window.location.hostname : 'unknown')
    );
  }
  return errorHandlerInstance;
}

/**
 * Cria uma nova instância do ErrorHandler
 */
export function createErrorHandler(appName: string): ErrorHandler {
  return new ErrorHandler(appName);
}

