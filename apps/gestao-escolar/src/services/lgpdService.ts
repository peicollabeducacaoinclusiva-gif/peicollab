import { supabase } from '@pei/database';
import { consentService, type ConsentType, type Consent, type UserConsent } from '@pei/database/consent';
import { auditMiddleware } from '@pei/database/audit';

export type ConsentMethod = 'digital' | 'paper' | 'verbal';

export type LGPDRequestType = 
  | 'access'
  | 'rectification'
  | 'deletion'
  | 'portability'
  | 'opposition'
  | 'restriction';

export type LGPDRequestStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

// DataConsent mantido para compatibilidade retroativa, mas internamente usa Consent
export type DataConsent = Consent & {
  consent_given?: boolean; // Alias para granted
  consent_date?: string; // Alias para granted_at
  consent_method?: ConsentMethod;
  consent_version?: string;
  withdrawn_at?: string; // Alias para revoked_at
  withdrawn_reason?: string;
};

export interface PrivacyPolicy {
  id: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
  expiry_date?: string;
  is_active: boolean;
  tenant_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LGPDRequest {
  id: string;
  request_type: LGPDRequestType;
  student_id?: string;
  guardian_id?: string;
  requested_by: string;
  requested_by_cpf?: string;
  requested_by_email?: string;
  requested_by_phone?: string;
  request_description: string;
  status: LGPDRequestStatus;
  assigned_to?: string;
  response_data?: any;
  response_date?: string;
  rejection_reason?: string;
  tenant_id: string;
  school_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DataAnonymization {
  id: string;
  student_id: string;
  lgpd_request_id?: string;
  anonymization_type: 'full' | 'partial';
  anonymized_fields: string[];
  anonymized_data?: any;
  anonymized_at: string;
  anonymized_by?: string;
  reason: string;
  tenant_id: string;
  created_at: string;
}

export const lgpdService = {
  async getConsents(filters: {
    studentId?: string;
    guardianId?: string;
    consentType?: ConsentType;
    activeOnly?: boolean;
    tenantId?: string;
  }): Promise<DataConsent[]> {
    // Usar consentService para buscar consentimentos
    if (!filters.tenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        if (profile?.tenant_id) {
          filters.tenantId = profile.tenant_id;
        }
      }
    }

    if (!filters.tenantId) {
      throw new Error('tenantId é obrigatório para buscar consentimentos');
    }

    // Buscar usando consentService
    const consents = await consentService.getUserConsents(
      filters.tenantId,
      undefined, // userId
      filters.studentId || undefined,
      filters.guardianId || undefined
    );

    // Filtrar e mapear para formato DataConsent (compatibilidade)
    let filtered = consents;
    if (filters.consentType) {
      filtered = filtered.filter(c => c.consent_type === filters.consentType);
    }
    if (filters.activeOnly) {
      filtered = filtered.filter(c => c.granted && !c.revoked_at);
    }

    // Mapear para formato DataConsent
    return filtered.map(c => ({
      id: '', // Será preenchido se necessário buscar da tabela
      tenant_id: filters.tenantId!,
      consent_type: c.consent_type,
      granted: c.granted,
      granted_at: c.granted_at,
      revoked_at: c.revoked_at,
      metadata: c.metadata,
      // Aliases para compatibilidade
      consent_given: c.granted,
      consent_date: c.granted_at,
      withdrawn_at: c.revoked_at,
      withdrawn_reason: c.metadata?.withdrawn_reason as string,
      consent_method: c.metadata?.consent_method as ConsentMethod,
      consent_version: c.metadata?.consent_version as string,
    } as DataConsent));
  },

  async createConsent(consent: Partial<DataConsent>): Promise<DataConsent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Obter tenant_id
    let tenantId = consent.tenant_id;
    if (!tenantId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      tenantId = profile?.tenant_id;
    }

    if (!tenantId) {
      throw new Error('tenantId é obrigatório para criar consentimento');
    }

    // Usar consentService para criar
    const consentId = await consentService.grantConsent(
      tenantId,
      (consent.consent_type || consent.consent_given ? 'data_collection' : 'data_processing') as ConsentType,
      {
        userId: user.id,
        studentId: consent.student_id,
        guardianId: consent.guardian_id,
        metadata: {
          consent_method: consent.consent_method || 'digital',
          consent_version: consent.consent_version || '1.0',
          ...consent.metadata,
        },
      }
    );

    // Buscar o consentimento criado para retornar
    const { data: created, error } = await supabase
      .from('consents')
      .select('*')
      .eq('id', consentId)
      .single();

    if (error) throw error;

    // Mapear para formato DataConsent
    return {
      ...created,
      consent_given: created.granted,
      consent_date: created.granted_at,
      withdrawn_at: created.revoked_at,
      consent_method: created.metadata?.consent_method as ConsentMethod,
      consent_version: created.metadata?.consent_version as string,
    } as DataConsent;
  },

  async withdrawConsent(consentId: string, reason: string): Promise<void> {
    // Buscar consentimento para obter tenant_id e consent_type
    const { data: consent, error: fetchError } = await supabase
      .from('consents')
      .select('tenant_id, consent_type, user_id, student_id, guardian_id')
      .eq('id', consentId)
      .single();

    if (fetchError || !consent) {
      throw fetchError || new Error('Consentimento não encontrado');
    }

    // Usar consentService para revogar
    await consentService.revokeConsent(
      consent.tenant_id,
      consent.consent_type,
      {
        userId: consent.user_id || undefined,
        studentId: consent.student_id || undefined,
        guardianId: consent.guardian_id || undefined,
        reason,
      }
    );
  },

  async checkActiveConsents(studentId: string, consentType?: ConsentType): Promise<any> {
    // Obter tenant_id do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw profileError || new Error('tenant_id não encontrado no perfil');
    }

    // Usar RPC canônica que lê de "consents"
    const { data, error } = await supabase.rpc('get_user_consents', {
      p_tenant_id: profile.tenant_id,
      p_user_id: null,
      p_student_id: studentId,
      p_guardian_id: null,
    });

    if (error) throw error;

    const consents = Array.isArray(data) ? data : [];
    const filtered = consentType
      ? consents.filter((c: any) => c.consent_type === consentType)
      : consents;

    const has_active_consents = filtered.some(
      (c: any) => c.granted === true && !c.revoked_at
    );

    return {
      student_id: studentId,
      consents: filtered,
      has_active_consents,
    };
  },

  async getPrivacyPolicies(tenantId: string, activeOnly: boolean = true): Promise<PrivacyPolicy[]> {
    let query = supabase
      .from('privacy_policies')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('effective_date', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createPrivacyPolicy(policy: Partial<PrivacyPolicy>): Promise<PrivacyPolicy> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('privacy_policies')
      .insert({
        ...policy,
        is_active: policy.is_active !== undefined ? policy.is_active : true,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getLGPDRequests(filters: {
    tenantId?: string;
    studentId?: string;
    requestType?: LGPDRequestType;
    status?: LGPDRequestStatus;
  }): Promise<LGPDRequest[]> {
    let query = supabase
      .from('lgpd_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.requestType) {
      query = query.eq('request_type', filters.requestType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createLGPDRequest(request: Partial<LGPDRequest>): Promise<LGPDRequest> {
    const { data, error } = await supabase
      .from('lgpd_requests')
      .insert({
        ...request,
        status: request.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLGPDRequestStatus(
    requestId: string,
    status: LGPDRequestStatus,
    responseData?: any,
    rejectionReason?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' && responseData) {
      updateData.response_data = responseData;
      updateData.response_date = new Date().toISOString();
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('lgpd_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) throw error;
  },

  async exportPersonalData(studentId: string): Promise<any> {
    // Buscar tenant_id do estudante para auditoria
    const { data: student } = await supabase
      .from('students')
      .select('tenant_id, name')
      .eq('id', studentId)
      .single();

    if (!student?.tenant_id) {
      throw new Error('Estudante não encontrado ou sem tenant_id');
    }

    const { data, error } = await supabase.rpc('export_personal_data', {
      p_student_id: studentId,
    });

    if (error) {
      // Reportar erro crítico de exportação de dados sensíveis
      if (typeof window !== 'undefined') {
        console.error('Erro crítico ao exportar dados sensíveis:', error);
        // TODO: Implementar reportSensitiveDataAccessError quando disponível
      }
      throw error;
    }

    // Gravar auditoria de exportação (dados sensíveis)
    if (data && student.tenant_id) {
      await auditMiddleware.logExport(
        student.tenant_id,
        'student',
        studentId,
        {
          source: 'export_personal_data',
          student_name: student.name,
          export_type: 'full',
        }
      ).catch(err => console.error('Erro ao gravar auditoria de exportação:', err));
    }

    return data;
  },

  async anonymizeStudentData(
    studentId: string,
    reason: string,
    anonymizedBy?: string
  ): Promise<{ success: boolean }> {
    const { data, error } = await supabase.rpc('anonymize_student_data', {
      p_student_id: studentId,
      p_reason: reason,
      p_anonymized_by: anonymizedBy || null,
    });

    if (error) throw error;
    return data;
  },

  async getAnonymizationRecords(filters: {
    studentId?: string;
    tenantId?: string;
  }): Promise<DataAnonymization[]> {
    let query = supabase
      .from('data_anonymization')
      .select('*')
      .order('anonymized_at', { ascending: false });

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },
};




