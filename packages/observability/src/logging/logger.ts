import pino from 'pino';
import { supabase } from '@pei/database';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
  level?: LogLevel;
  environment?: string;
  service?: string;
  appName?: string;
  tenantId?: string;
}

export interface LogContext {
  [key: string]: unknown;
  tenant_id?: string;
  user_id?: string;
  app_name?: string;
  url?: string;
  user_agent?: string;
  ip_address?: string;
}

/**
 * Logger centralizado com integração ao Supabase
 * Expande o logger base com funcionalidades avançadas
 */
export class Logger {
  private logger: pino.Logger;
  private config: Required<LoggerConfig>;
  private appName: string;
  private tenantId: string | null = null;

  constructor(config: LoggerConfig = {}) {
    const {
      level = 'info',
      environment = import.meta.env.MODE || 'development',
      service = 'pei-collab',
      appName = 'unknown',
      tenantId = null,
    } = config;

    this.config = {
      level,
      environment,
      service,
      appName,
      tenantId: tenantId || '',
    };

    this.appName = appName;
    this.tenantId = tenantId || '';

    this.logger = pino({
      level,
      base: {
        env: environment,
        service,
        app: appName,
        tenant_id: tenantId || undefined,
      },
      transport:
        environment === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });
  }

  /**
   * Define o tenant_id atual
   */
  setTenantId(tenantId: string | null): void {
    this.tenantId = tenantId;
    this.logger = this.logger.child({ tenant_id: tenantId || undefined });
  }

  /**
   * Define o app_name atual
   */
  setAppName(appName: string): void {
    this.appName = appName;
    this.logger = this.logger.child({ app: appName });
  }

  /**
   * Log com contexto enriquecido
   */
  private logWithContext(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown
  ): void {
    const enrichedContext: LogContext = {
      ...context,
      app_name: this.appName,
      tenant_id: this.tenantId || context?.tenant_id,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    if (error instanceof Error) {
      enrichedContext.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error) {
      enrichedContext.error = error;
    }

    this.logger[level](enrichedContext, message);
  }

  trace(message: string, context?: LogContext): void {
    this.logWithContext('trace', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.logWithContext('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logWithContext('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logWithContext('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.logWithContext('error', message, context, error);
    
    // Enviar erro crítico para central de erros
    if (this.config.environment === 'production' || import.meta.env.PROD) {
      this.reportErrorToCentral(message, error, context).catch((err) => {
        console.error('Erro ao reportar erro para central:', err);
      });
    }
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    this.logWithContext('fatal', message, context, error);
    
    // Sempre reportar erros fatais
    this.reportErrorToCentral(message, error, { ...context, fatal: true }).catch((err) => {
      console.error('Erro ao reportar erro fatal para central:', err);
    });
  }

  /**
   * Reporta erro para central de erros no Supabase
   */
  private async reportErrorToCentral(
    message: string,
    error?: Error | unknown,
    context?: LogContext
  ): Promise<void> {
    try {
      const errorType = this.determineErrorType(error);
      const severity = this.determineSeverity(error, context);

      await supabase.rpc('report_error', {
        p_app_name: this.appName,
        p_error_type: errorType,
        p_message: message,
        p_stack_trace: error instanceof Error ? error.stack : undefined,
        p_tenant_id: this.tenantId || context?.tenant_id || null,
        p_user_id: context?.user_id || null,
        p_url: context?.url || (typeof window !== 'undefined' ? window.location.href : null),
        p_user_agent: context?.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
        p_ip_address: context?.ip_address || null,
        p_metadata: context || {},
        p_severity: severity,
      });
    } catch (reportError) {
      // Não lançar erro para não interromper o fluxo principal
      console.error('Erro ao reportar para central:', reportError);
    }
  }

  /**
   * Determina o tipo de erro baseado no erro
   */
  private determineErrorType(error?: Error | unknown): string {
    if (!error) return 'unknown_error';
    
    if (error instanceof TypeError) return 'javascript_error';
    if (error instanceof ReferenceError) return 'javascript_error';
    if (error instanceof SyntaxError) return 'javascript_error';
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) return 'network_error';
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) return 'authentication_error';
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) return 'authorization_error';
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) return 'validation_error';
    if (errorMessage.includes('database') || errorMessage.includes('sql')) return 'database_error';
    if (errorMessage.includes('api') || errorMessage.includes('endpoint')) return 'api_error';
    
    return 'unknown_error';
  }

  /**
   * Determina severidade baseado no erro e contexto
   */
  private determineSeverity(error?: Error | unknown, context?: LogContext): string {
    if (context?.fatal) return 'critical';
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('critical') || errorMessage.includes('fatal')) return 'critical';
    if (errorMessage.includes('security') || errorMessage.includes('unauthorized')) return 'high';
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) return 'medium';
    
    return 'low';
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

/**
 * Cria uma nova instância do logger
 */
export function createLogger(config?: LoggerConfig): Logger {
  const logger = new Logger(config);
  if (!loggerInstance) {
    loggerInstance = logger;
  }
  return logger;
}

/**
 * Obtém instância singleton do logger
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger({
      appName: typeof window !== 'undefined' ? window.location.hostname : 'server',
    });
  }
  return loggerInstance;
}

// Export default logger
export const logger = getLogger();

