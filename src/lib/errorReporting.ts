/**
 * Helper para reportar erros para o sistema de observabilidade
 * Centraliza a lógica de error reporting em pontos críticos
 */

let errorReporterModule: typeof import('@pei/observability') | null = null;

/**
 * Inicializa o módulo de error reporting (lazy loading)
 */
async function getErrorReporter() {
  if (!errorReporterModule) {
    errorReporterModule = await import('@pei/observability');
  }
  return errorReporterModule.errorReporter;
}

/**
 * Reporta erro crítico de autenticação
 */
export async function reportAuthError(
  error: Error,
  context: {
    operation: 'login' | 'logout' | 'password_reset' | 'session_check';
    email?: string;
    userId?: string;
    tenantId?: string;
  }
): Promise<void> {
  try {
    const errorReporter = await getErrorReporter();
    await errorReporter.reportError('pei-collab', error, {
      userId: context.userId,
      tenantId: context.tenantId,
      severity: 'high',
      metadata: {
        operation: context.operation,
        email: context.email ? context.email.replace(/@.*/, '@***') : undefined, // Mascarar email
        error_type: 'authentication_error',
      },
    });
  } catch (err) {
    // Silenciosamente falhar se não conseguir reportar
    console.error('Erro ao reportar erro de autenticação:', err);
  }
}

/**
 * Reporta erro crítico de acesso a dados sensíveis
 */
export async function reportSensitiveDataAccessError(
  error: Error,
  context: {
    operation: 'read' | 'export' | 'anonymize';
    entityType: 'pei' | 'student' | 'guardian' | 'user';
    entityId?: string;
    tenantId?: string;
    userId?: string;
  }
): Promise<void> {
  try {
    const errorReporter = await getErrorReporter();
    await errorReporter.reportError('pei-collab', error, {
      userId: context.userId,
      tenantId: context.tenantId,
      severity: 'critical',
      metadata: {
        operation: context.operation,
        entity_type: context.entityType,
        entity_id: context.entityId,
        error_type: 'sensitive_data_access_error',
      },
    });
  } catch (err) {
    console.error('Erro ao reportar erro de acesso a dados sensíveis:', err);
  }
}

/**
 * Reporta erro crítico de operações de PEI
 */
export async function reportPEIError(
  error: Error,
  context: {
    operation: 'create' | 'update' | 'delete' | 'approve' | 'load';
    peiId?: string;
    studentId?: string;
    tenantId?: string;
    userId?: string;
  }
): Promise<void> {
  try {
    const errorReporter = await getErrorReporter();
    await errorReporter.reportError('pei-collab', error, {
      userId: context.userId,
      tenantId: context.tenantId,
      severity: 'high',
      metadata: {
        operation: context.operation,
        pei_id: context.peiId,
        student_id: context.studentId,
        error_type: 'pei_operation_error',
      },
    });
  } catch (err) {
    console.error('Erro ao reportar erro de PEI:', err);
  }
}

/**
 * Reporta erro genérico com contexto
 */
export async function reportError(
  error: Error,
  context: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    operation?: string;
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    const errorReporter = await getErrorReporter();
    await errorReporter.reportError('pei-collab', error, {
      userId: context.userId,
      tenantId: context.tenantId,
      severity: context.severity || 'medium',
      metadata: {
        operation: context.operation,
        ...context.metadata,
      },
    });
  } catch (err) {
    console.error('Erro ao reportar erro:', err);
  }
}

