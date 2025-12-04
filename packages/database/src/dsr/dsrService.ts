import { supabase } from '../client';
import { getAuditLogger } from '../audit';

export type DSRRequestType = 
  | 'access'
  | 'rectification'
  | 'deletion'
  | 'portability'
  | 'opposition'
  | 'restriction';

export type DSRSubjectType = 'student' | 'user' | 'guardian' | 'professional';

export type DSRRequestStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface DSRRequest {
  id: string;
  tenant_id: string;
  subject_id: string;
  subject_type: DSRSubjectType;
  request_type: DSRRequestType;
  status: DSRRequestStatus;
  requested_by: string;
  requested_by_cpf?: string;
  requested_by_email?: string;
  requested_by_phone?: string;
  request_description: string;
  assigned_to?: string;
  response_data?: Record<string, unknown>;
  response_date?: string;
  rejection_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateDSRRequestParams {
  tenantId: string;
  subjectId: string;
  subjectType: DSRSubjectType;
  requestType: DSRRequestType;
  requestedBy: string;
  requestDescription: string;
  requestedByCpf?: string;
  requestedByEmail?: string;
  requestedByPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface ExportDataResult {
  subject_id: string;
  subject_type: string;
  tenant_id: string;
  exported_at: string;
  format_version: string;
  data: {
    profile?: Record<string, unknown>;
    enrollments?: unknown[];
    grades?: unknown[];
    attendance?: unknown[];
    peis?: unknown[];
    aee?: unknown[];
    consents?: unknown[];
    audit_events?: unknown[];
  };
}

export interface AnonymizeDataResult {
  success: boolean;
  subject_id: string;
  subject_type: string;
  anonymized_fields: string[];
  anonymized_at: string;
  anonymization_id: string;
}

/**
 * Serviço de gerenciamento de Direitos do Titular (DSR)
 */
export const dsrService = {
  /**
   * Cria uma nova solicitação DSR
   */
  async createRequest(params: CreateDSRRequestParams): Promise<string> {
    const { data, error } = await supabase.rpc('create_dsr_request', {
      p_tenant_id: params.tenantId,
      p_subject_id: params.subjectId,
      p_subject_type: params.subjectType,
      p_request_type: params.requestType,
      p_requested_by: params.requestedBy,
      p_request_description: params.requestDescription,
      p_requested_by_cpf: params.requestedByCpf || null,
      p_requested_by_email: params.requestedByEmail || null,
      p_requested_by_phone: params.requestedByPhone || null,
      p_metadata: params.metadata || {},
    });

    if (error) {
      console.error('Erro ao criar solicitação DSR:', error);
      throw error;
    }

    return data || '';
  },

  /**
   * Busca solicitações DSR com filtros
   */
  async getRequests(filters: {
    tenantId: string;
    subjectId?: string;
    subjectType?: DSRSubjectType;
    requestType?: DSRRequestType;
    status?: DSRRequestStatus;
    limit?: number;
  }): Promise<DSRRequest[]> {
    const { data, error } = await supabase.rpc('get_dsr_requests', {
      p_tenant_id: filters.tenantId,
      p_subject_id: filters.subjectId || null,
      p_subject_type: filters.subjectType || null,
      p_request_type: filters.requestType || null,
      p_status: filters.status || null,
      p_limit: filters.limit || 100,
    });

    if (error) {
      console.error('Erro ao buscar solicitações DSR:', error);
      throw error;
    }

    return (data || []) as DSRRequest[];
  },

  /**
   * Atualiza o status de uma solicitação DSR
   */
  async updateRequestStatus(
    requestId: string,
    status: DSRRequestStatus,
    options: {
      responseData?: Record<string, unknown>;
      rejectionReason?: string;
      assignedTo?: string;
    } = {}
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_dsr_request_status', {
      p_request_id: requestId,
      p_status: status,
      p_response_data: options.responseData || null,
      p_rejection_reason: options.rejectionReason || null,
      p_assigned_to: options.assignedTo || null,
    });

    if (error) {
      console.error('Erro ao atualizar status da solicitação DSR:', error);
      throw error;
    }

    return data || false;
  },

  /**
   * Exporta dados pessoais (portabilidade)
   */
  async exportPersonalData(
    tenantId: string,
    subjectId: string,
    subjectType: DSRSubjectType
  ): Promise<ExportDataResult> {
    const { data, error } = await supabase.rpc('export_personal_data_v2', {
      p_subject_id: subjectId,
      p_subject_type: subjectType,
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error('Erro ao exportar dados pessoais:', error);
      throw error;
    }

    return data as ExportDataResult;
  },

  /**
   * Anonimiza dados pessoais (direito ao esquecimento)
   */
  async anonymizePersonalData(
    tenantId: string,
    subjectId: string,
    subjectType: DSRSubjectType,
    reason: string,
    anonymizedBy?: string
  ): Promise<AnonymizeDataResult> {
    const { data, error } = await supabase.rpc('anonymize_personal_data_v2', {
      p_subject_id: subjectId,
      p_subject_type: subjectType,
      p_tenant_id: tenantId,
      p_reason: reason,
      p_anonymized_by: anonymizedBy || null,
    });

    if (error) {
      console.error('Erro ao anonimizar dados pessoais:', error);
      throw error;
    }

    return data as AnonymizeDataResult;
  },

  /**
   * Processa uma solicitação DSR automaticamente
   */
  async processRequest(
    requestId: string,
    tenantId: string
  ): Promise<{ success: boolean; data?: ExportDataResult | AnonymizeDataResult }> {
    try {
      // Buscar solicitação
      const requests = await this.getRequests({ tenantId, limit: 1 });
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        throw new Error('Solicitação DSR não encontrada');
      }

      // Atualizar status para em progresso
      await this.updateRequestStatus(requestId, 'in_progress');

      let result: ExportDataResult | AnonymizeDataResult | undefined;

      // Processar baseado no tipo de solicitação
      if (request.request_type === 'portability' || request.request_type === 'access') {
        // Exportar dados
        result = await this.exportPersonalData(
          request.tenant_id,
          request.subject_id,
          request.subject_type
        );

        // Atualizar solicitação com dados exportados
        await this.updateRequestStatus(requestId, 'completed', {
          responseData: {
            export_data: result,
            exported_at: new Date().toISOString(),
          },
        });
      } else if (request.request_type === 'deletion') {
        // Anonimizar dados
        result = await this.anonymizePersonalData(
          request.tenant_id,
          request.subject_id,
          request.subject_type,
          request.request_description || 'Solicitação de exclusão via DSR'
        );

        // Atualizar solicitação
        await this.updateRequestStatus(requestId, 'completed', {
          responseData: {
            anonymization_result: result,
            anonymized_at: new Date().toISOString(),
          },
        });
      } else {
        // Outros tipos de solicitação requerem processamento manual
        throw new Error(`Tipo de solicitação ${request.request_type} requer processamento manual`);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao processar solicitação DSR:', error);
      
      // Atualizar status para rejeitado em caso de erro
      try {
        await this.updateRequestStatus(requestId, 'rejected', {
          rejectionReason: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      } catch (updateError) {
        console.error('Erro ao atualizar status da solicitação:', updateError);
      }

      throw error;
    }
  },
};

