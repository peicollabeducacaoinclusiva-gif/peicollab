import { supabase } from '../client';
import { auditMiddleware } from '../audit/auditMiddleware';

export type ConsentType = 
  | 'data_collection'
  | 'data_sharing'
  | 'data_processing'
  | 'marketing'
  | 'research'
  | 'photo_video'
  | 'analytics'
  | 'cookies'
  | 'third_party';

export interface Consent {
  id: string;
  tenant_id: string;
  user_id?: string;
  student_id?: string;
  guardian_id?: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsentTemplate {
  id: string;
  tenant_id: string;
  consent_type: ConsentType;
  required: boolean;
  title: string;
  description: string;
  version: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserConsent {
  consent_type: ConsentType;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  metadata: Record<string, unknown>;
}

/**
 * Serviço de gerenciamento de consentimentos LGPD
 */
export const consentService = {
  /**
   * Concede um consentimento
   */
  async grantConsent(
    tenantId: string,
    consentType: ConsentType,
    options: {
      userId?: string;
      studentId?: string;
      guardianId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<string> {
    const { data, error } = await supabase.rpc('grant_consent', {
      p_tenant_id: tenantId,
      p_consent_type: consentType,
      p_user_id: options.userId || null,
      p_student_id: options.studentId || null,
      p_guardian_id: options.guardianId || null,
      p_metadata: options.metadata || {},
    });

    if (error) {
      console.error('Erro ao conceder consentimento:', error);
      throw error;
    }

    const consentId = data || '';
    
    // Gravar auditoria
    if (consentId) {
      await auditMiddleware.logCreate(
        tenantId,
        'consent',
        consentId,
        {
          consent_type: consentType,
          source: 'grant_consent',
          user_id: options.userId,
          student_id: options.studentId,
          guardian_id: options.guardianId,
        }
      ).catch(err => console.error('Erro ao gravar auditoria de consentimento:', err));
    }

    return consentId;
  },

  /**
   * Revoga um consentimento
   */
  async revokeConsent(
    tenantId: string,
    consentType: ConsentType,
    options: {
      userId?: string;
      studentId?: string;
      guardianId?: string;
      reason?: string;
    } = {}
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('revoke_consent', {
      p_tenant_id: tenantId,
      p_consent_type: consentType,
      p_user_id: options.userId || null,
      p_student_id: options.studentId || null,
      p_guardian_id: options.guardianId || null,
      p_reason: options.reason || null,
    });

    if (error) {
      console.error('Erro ao revogar consentimento:', error);
      throw error;
    }

    const revoked = data || false;
    
    // Gravar auditoria se revogado com sucesso
    if (revoked) {
      // Buscar ID do consentimento para auditoria
      const { data: consentData } = await supabase
        .from('consents')
        .select('id, granted, granted_at')
        .eq('tenant_id', tenantId)
        .eq('consent_type', consentType)
        .eq('granted', true)
        .is('revoked_at', null)
        .maybeSingle();
      
      if (consentData?.id) {
        await auditMiddleware.logUpdate(
          tenantId,
          'consent',
          consentData.id,
          { granted: true, granted_at: consentData.granted_at },
          { granted: false, revoked_at: new Date().toISOString() },
          `Consentimento ${consentType} revogado${options.reason ? `: ${options.reason}` : ''}`
        ).catch(err => console.error('Erro ao gravar auditoria de revogação:', err));
      }
    }

    return revoked;
  },

  /**
   * Verifica se existe consentimento ativo
   */
  async checkConsent(
    tenantId: string,
    consentType: ConsentType,
    options: {
      userId?: string;
      studentId?: string;
      guardianId?: string;
    } = {}
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_consent', {
      p_tenant_id: tenantId,
      p_consent_type: consentType,
      p_user_id: options.userId || null,
      p_student_id: options.studentId || null,
      p_guardian_id: options.guardianId || null,
    });

    if (error) {
      console.error('Erro ao verificar consentimento:', error);
      throw error;
    }

    return data || false;
  },

  /**
   * Obtém todos os consentimentos de um usuário/estudante
   */
  async getUserConsents(
    tenantId: string,
    options: {
      userId?: string;
      studentId?: string;
      guardianId?: string;
    } = {}
  ): Promise<UserConsent[]> {
    const { data, error } = await supabase.rpc('get_user_consents', {
      p_tenant_id: tenantId,
      p_user_id: options.userId || null,
      p_student_id: options.studentId || null,
      p_guardian_id: options.guardianId || null,
    });

    if (error) {
      console.error('Erro ao obter consentimentos:', error);
      throw error;
    }

    return (data || []) as UserConsent[];
  },

  /**
   * Obtém templates de consentimento ativos do tenant
   */
  async getConsentTemplates(tenantId: string): Promise<ConsentTemplate[]> {
    const { data, error } = await supabase
      .from('consent_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('consent_type');

    if (error) {
      console.error('Erro ao obter templates de consentimento:', error);
      throw error;
    }

    return (data || []) as ConsentTemplate[];
  },

  /**
   * Cria ou atualiza um template de consentimento
   */
  async upsertConsentTemplate(template: Omit<ConsentTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ConsentTemplate> {
    const { data, error } = await supabase
      .from('consent_templates')
      .upsert({
        ...template,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,consent_type,version',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar template de consentimento:', error);
      throw error;
    }

    return data as ConsentTemplate;
  },
};

