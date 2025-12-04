import { getLogger } from '@pei/observability';

// Re-export logger para uso no app
export const logger = getLogger();

// Helper para logging de ações do usuário
export function logUserAction(action: string, context?: Record<string, unknown>) {
  logger.info(`User action: ${action}`, {
    action,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

// Helper para logging de erros de API
export function logApiError(endpoint: string, error: Error, context?: Record<string, unknown>) {
  logger.error(`API error: ${endpoint}`, error, {
    endpoint,
    ...context,
  });
}

// Helper para logging de performance
export function logPerformance(operation: string, duration: number, context?: Record<string, unknown>) {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration,
    unit: 'ms',
    ...context,
  });
}

