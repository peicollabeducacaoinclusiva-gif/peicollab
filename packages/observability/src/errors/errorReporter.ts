import { supabase } from '@pei/database';
import { getLogger } from '../logging/logger';
import type { ErrorSeverity } from './errorHandler';

export interface ErrorReport {
  appName: string;
  errorType: string;
  message: string;
  stackTrace?: string;
  tenantId?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  severity: ErrorSeverity;
}

/**
 * Reporter de erros para central de erros
 */
export class ErrorReporter {
  private logger = getLogger();
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;

  /**
   * Reporta um erro para a central
   */
  async reportError(
    appName: string,
    error: Error,
    options?: {
      tenantId?: string;
      userId?: string;
      url?: string;
      userAgent?: string;
      ipAddress?: string;
      metadata?: Record<string, unknown>;
      severity?: ErrorSeverity;
    }
  ): Promise<string | null> {
    const errorType = this.determineErrorType(error);
    const severity = options?.severity || 'medium';

    const report: ErrorReport = {
      appName,
      errorType,
      message: error.message,
      stackTrace: error.stack,
      tenantId: options?.tenantId,
      userId: options?.userId,
      url: options?.url || (typeof window !== 'undefined' ? window.location.href : undefined),
      userAgent: options?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      ipAddress: options?.ipAddress,
      metadata: options?.metadata,
      severity,
    };

    // Adicionar à fila
    this.errorQueue.push(report);

    // Processar fila (debounced)
    this.processQueue();

    try {
      // Tentar enviar imediatamente
      const { data, error: rpcError } = await supabase.rpc('report_error', {
        p_app_name: report.appName,
        p_error_type: report.errorType,
        p_message: report.message,
        p_stack_trace: report.stackTrace,
        p_tenant_id: report.tenantId || null,
        p_user_id: report.userId || null,
        p_url: report.url || null,
        p_user_agent: report.userAgent || null,
        p_ip_address: report.ipAddress || null,
        p_metadata: report.metadata || {},
        p_severity: report.severity,
      });

      if (rpcError) {
        throw rpcError;
      }

      return data as string | null;
    } catch (error) {
      this.logger.warn('Erro ao reportar para central (será retentado)', { error });
      // Erro será processado pela fila
      return null;
    }
  }

  /**
   * Processa fila de erros pendentes
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const report = this.errorQueue.shift();
        if (!report) break;

        try {
          await supabase.rpc('report_error', {
            p_app_name: report.appName,
            p_error_type: report.errorType,
            p_message: report.message,
            p_stack_trace: report.stackTrace,
            p_tenant_id: report.tenantId || null,
            p_user_id: report.userId || null,
            p_url: report.url || null,
            p_user_agent: report.userAgent || null,
            p_ip_address: report.ipAddress || null,
            p_metadata: report.metadata || {},
            p_severity: report.severity,
          });
        } catch (error) {
          // Re-adicionar à fila se falhar
          this.errorQueue.push(report);
          this.logger.warn('Erro ao processar report da fila', { error });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Determina tipo de erro
   */
  private determineErrorType(error: Error): string {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('type') || name.includes('reference') || name.includes('syntax')) {
      return 'javascript_error';
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network_error';
    }

    if (message.includes('401') || message.includes('unauthorized')) {
      return 'authentication_error';
    }

    if (message.includes('403') || message.includes('forbidden')) {
      return 'authorization_error';
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation_error';
    }

    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return 'database_error';
    }

    if (message.includes('api') || message.includes('endpoint') || message.includes('500')) {
      return 'api_error';
    }

    return 'unknown_error';
  }
}

// Instância singleton
export const errorReporter = new ErrorReporter();

