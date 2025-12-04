import { supabase } from '@pei/database';
import { getLogger } from '../logging/logger';

export type AlertType = 'error_rate' | 'performance' | 'availability' | 'security' | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id?: string;
  app_name: string;
  tenant_id?: string;
  alert_type: AlertType;
  alert_name: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metadata?: Record<string, unknown>;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at?: string;
}

export interface AlertRule {
  id?: string;
  tenant_id?: string;
  app_name?: string;
  rule_name: string;
  alert_type: AlertType;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    window?: string; // '1h', '24h', etc.
  };
  severity: AlertSeverity;
  notification_channels?: string[];
  is_active?: boolean;
}

/**
 * Gerenciador de alertas
 * Cria, gerencia e notifica sobre alertas
 */
export class AlertManager {
  private logger = getLogger();

  /**
   * Cria um alerta
   */
  async createAlert(alert: Omit<Alert, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          app_name: alert.app_name,
          tenant_id: alert.tenant_id || null,
          alert_type: alert.alert_type,
          alert_name: alert.alert_name,
          message: alert.message,
          severity: alert.severity,
          status: alert.status || 'active',
          metadata: alert.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      this.logger.info('Alerta criado', {
        alertId: data.id,
        alertName: alert.alert_name,
        severity: alert.severity,
      });

      // Enviar notificações se configurado
      await this.sendNotifications(data.id, alert);

      return data.id;
    } catch (error) {
      this.logger.error('Erro ao criar alerta', error);
      return null;
    }
  }

  /**
   * Obtém alertas
   */
  async getAlerts(filters?: {
    app_name?: string;
    tenant_id?: string;
    alert_type?: AlertType;
    status?: AlertStatus;
    severity?: AlertSeverity;
    limit?: number;
  }): Promise<Alert[]> {
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.app_name) {
        query = query.eq('app_name', filters.app_name);
      }

      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }

      if (filters?.alert_type) {
        query = query.eq('alert_type', filters.alert_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as Alert[];
    } catch (error) {
      this.logger.error('Erro ao buscar alertas', error);
      return [];
    }
  }

  /**
   * Atualiza status de um alerta
   */
  async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    userId?: string
  ): Promise<boolean> {
    try {
      const updateData: Record<string, unknown> = {
        status,
      };

      if (status === 'acknowledged') {
        updateData.acknowledged_at = new Date().toISOString();
        updateData.acknowledged_by = userId || null;
      }

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = userId || null;
      }

      const { error } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', alertId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      this.logger.error('Erro ao atualizar status do alerta', error);
      return false;
    }
  }

  /**
   * Cria uma regra de alerta
   */
  async createAlertRule(rule: AlertRule): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          tenant_id: rule.tenant_id || null,
          app_name: rule.app_name || null,
          rule_name: rule.rule_name,
          alert_type: rule.alert_type,
          condition: rule.condition,
          severity: rule.severity,
          notification_channels: rule.notification_channels || [],
          is_active: rule.is_active !== false,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      this.logger.error('Erro ao criar regra de alerta', error);
      return null;
    }
  }

  /**
   * Obtém regras de alerta
   */
  async getAlertRules(filters?: {
    tenant_id?: string;
    app_name?: string;
    is_active?: boolean;
  }): Promise<AlertRule[]> {
    try {
      let query = supabase.from('alert_rules').select('*');

      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }

      if (filters?.app_name) {
        query = query.eq('app_name', filters.app_name);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as AlertRule[];
    } catch (error) {
      this.logger.error('Erro ao buscar regras de alerta', error);
      return [];
    }
  }

  /**
   * Envia notificações para canais configurados
   */
  private async sendNotifications(alertId: string, alert: Alert): Promise<void> {
    // TODO: Implementar integração com email, Slack, webhooks, etc.
    this.logger.debug('Notificações de alerta (não implementado)', {
      alertId,
      alertName: alert.alert_name,
      severity: alert.severity,
    });
  }
}

// Instância singleton
let alertManagerInstance: AlertManager | null = null;

/**
 * Obtém instância singleton do AlertManager
 */
export function getAlertManager(): AlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = new AlertManager();
  }
  return alertManagerInstance;
}

/**
 * Cria uma nova instância do AlertManager
 */
export function createAlertManager(): AlertManager {
  return new AlertManager();
}

