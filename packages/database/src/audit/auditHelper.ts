/**
 * Helper centralizado para inserção de logs de auditoria
 * 
 * Substitui as funções locais insertAuditLog e padroniza o uso de auditMiddleware
 * para gravar eventos na tabela canônica audit_events.
 * 
 * Este helper está no pacote @pei/database para ser compartilhado entre todos os apps.
 */

import { auditMiddleware, type AuditEntityType } from './auditMiddleware';
import { supabase } from '../client';

export type AuditSeverity = 'info' | 'warning' | 'error';

export interface InsertAuditLogParams {
  action: string;
  details?: string;
  severity?: AuditSeverity;
  entityType?: AuditEntityType;
  entityId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Helper centralizado para inserir logs de auditoria
 * 
 * Usa auditMiddleware para gravar eventos na tabela canônica audit_events.
 * 
 * Aceita tanto a interface antiga (parâmetros separados) quanto a nova (objeto).
 * 
 * @param actionOrParams - String com a ação OU objeto com parâmetros completos
 * @param details - Detalhes da ação (se actionOrParams for string)
 * @param severity - Severidade do log (se actionOrParams for string)
 * @returns Promise que resolve quando o log é gravado (ou falha silenciosamente)
 */
export async function insertAuditLog(
  actionOrParams: string | InsertAuditLogParams,
  details?: string,
  severity?: AuditSeverity
): Promise<void> {
  // Compatibilidade com interface antiga: action, details, severity
  const params: InsertAuditLogParams = typeof actionOrParams === 'string'
    ? {
        action: actionOrParams,
        details,
        severity: severity || 'info',
      }
    : actionOrParams;

  try {
    // Obter tenantId se não fornecido
    let tenantId = params.tenantId;
    if (!tenantId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();
          
          tenantId = profile?.tenant_id || undefined;
        }
      } catch (err) {
        console.warn('Erro ao obter tenantId para auditoria:', err);
      }
    }

    // Se não tiver tenantId, não podemos gravar (audit_events requer tenantId)
    if (!tenantId) {
      console.warn('[AUDIT] Não foi possível gravar log: tenantId não disponível', params.action);
      // Fallback para console para não perder o log completamente
      console.log(`[AUDIT] ${params.action}: ${params.details || ''} (${params.severity || 'info'})`);
      return;
    }

    // Mapear severity para action type
    const auditAction = mapSeverityToAction(params.severity || 'info', params.action);
    
    // Usar entityId fornecido ou gerar um UUID genérico para eventos de sistema
    // Para eventos de sistema sem entityId específico, usar um ID baseado em timestamp
    // Formato: system-timestamp-random (compatível com UUID quando necessário)
    const generateSystemId = () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 11);
      return `system-${timestamp}-${random}`;
    };
    const entityId = params.entityId || generateSystemId();
    
    // Determinar entityType baseado no action ou usar o fornecido
    const entityType: AuditEntityType = params.entityType || 'system';

    // Preparar metadata
    const metadata: Record<string, unknown> = {
      action_description: params.action,
      details: params.details || '',
      severity: params.severity || 'info',
      ...params.metadata,
    };

    // Gravar usando auditMiddleware
    await auditMiddleware.logEvent({
      tenantId,
      entityType,
      entityId,
      action: auditAction,
      metadata,
    });

    // Log de debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] Log gravado: ${params.action} (${params.severity || 'info'})`);
    }
  } catch (error) {
    // Não lançar erro para não interromper o fluxo principal
    console.error('[AUDIT] Erro ao gravar log de auditoria:', error);
    // Fallback para console
    console.log(`[AUDIT] ${params.action}: ${params.details || ''} (${params.severity || 'info'})`);
  }
}

/**
 * Mapeia severity e action string para AuditAction
 */
function mapSeverityToAction(severity: AuditSeverity, actionString: string): 'INSERT' | 'UPDATE' | 'DELETE' | 'READ' {
  const lowerAction = actionString.toLowerCase();
  
  // Tentar inferir a action baseado na string
  if (lowerAction.includes('create') || lowerAction.includes('criar') || lowerAction.includes('novo')) {
    return 'INSERT';
  }
  if (lowerAction.includes('update') || lowerAction.includes('atualizar') || lowerAction.includes('editar')) {
    return 'UPDATE';
  }
  if (lowerAction.includes('delete') || lowerAction.includes('excluir') || lowerAction.includes('remover')) {
    return 'DELETE';
  }
  
  // Para eventos de sistema e outros, usar READ como padrão
  return 'READ';
}

/**
 * Helper para eventos de sistema (compatibilidade com interface antiga)
 */
export async function logSystemEvent(
  action: string,
  details?: string,
  severity: AuditSeverity = 'info'
): Promise<void> {
  return insertAuditLog({
    action,
    details,
    severity,
    entityType: 'system',
  });
}

