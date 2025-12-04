import { supabase } from '@pei/database';

export type AlertType = 'low_attendance' | 'critical_grade' | 'pei_goal_at_risk' | 'aee_missing';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  student_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, any>;
  status: AlertStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    name: string;
  };
}

export interface AlertRule {
  id: string;
  tenant_id?: string;
  rule_name: string;
  alert_type: AlertType;
  condition: Record<string, any>;
  severity: AlertSeverity;
  enabled: boolean;
  notification_channels: string[];
  created_at: string;
  updated_at: string;
}

export const alertService = {
  /**
   * Busca alertas de um aluno
   */
  async getStudentAlerts(
    studentId: string,
    status?: AlertStatus
  ): Promise<Alert[]> {
    let query = supabase
      .from('automatic_alerts')
      .select(`
        *,
        student:students!automatic_alerts_student_id_fkey(id, name)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      student: item.student,
    })) as Alert[];
  },

  /**
   * Busca todos os alertas ativos
   */
  async getActiveAlerts(
    tenantId?: string,
    schoolId?: string
  ): Promise<Alert[]> {
    let query = supabase
      .from('automatic_alerts')
      .select(`
        *,
        student:students!automatic_alerts_student_id_fkey(id, name, school_id, tenant_id)
      `)
      .eq('status', 'active')
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    let alerts = (data || []).map((item: any) => ({
      ...item,
      student: item.student,
    })) as Alert[];

    // Filtrar por tenant e escola se especificado
    if (tenantId) {
      alerts = alerts.filter((a) => a.student?.tenant_id === tenantId);
    }
    if (schoolId) {
      alerts = alerts.filter((a) => a.student?.school_id === schoolId);
    }

    return alerts;
  },

  /**
   * Reconhece um alerta
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('automatic_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  /**
   * Resolve um alerta
   */
  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('automatic_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  /**
   * Descarta um alerta
   */
  async dismissAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('automatic_alerts')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  /**
   * Verifica e cria alertas para um aluno
   */
  async checkAndCreateAlerts(studentId: string): Promise<void> {
    const { error } = await supabase.rpc('check_and_create_alerts', {
      p_student_id: studentId,
    });

    if (error) throw error;
  },

  /**
   * Busca regras de alertas
   */
  async getAlertRules(tenantId?: string): Promise<AlertRule[]> {
    let query = supabase
      .from('alert_rules')
      .select('*')
      .order('rule_name', { ascending: true });

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AlertRule[];
  },

  /**
   * Cria ou atualiza uma regra de alerta
   */
  async upsertAlertRule(rule: Partial<AlertRule>): Promise<AlertRule> {
    const { data, error } = await supabase
      .from('alert_rules')
      .upsert(
        {
          ...rule,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as AlertRule;
  },

  /**
   * Habilita ou desabilita uma regra
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('alert_rules')
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId);

    if (error) throw error;
  },
};

