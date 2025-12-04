/**
 * Serviço centralizado para operações de PEI
 * Instrumentado com auditoria automática
 */

import { supabase } from '@/integrations/supabase/client';
import { auditMiddleware } from '@pei/database/audit';

export interface CreatePEIData {
  student_id: string;
  school_id: string;
  tenant_id: string;
  assigned_teacher_id?: string;
  status?: 'draft' | 'pending' | 'approved' | 'returned';
  diagnosis_data?: Record<string, unknown>;
  planning_data?: Record<string, unknown>;
  evaluation_data?: Record<string, unknown>;
}

export interface UpdatePEIData {
  status?: 'draft' | 'pending' | 'approved' | 'returned';
  diagnosis_data?: Record<string, unknown>;
  planning_data?: Record<string, unknown>;
  evaluation_data?: Record<string, unknown>;
  assigned_teacher_id?: string;
}

export const peiService = {
  /**
   * Cria um novo PEI
   */
  async createPEI(data: CreatePEIData) {
    const { data: pei, error } = await supabase
      .from('peis')
      .insert({
        student_id: data.student_id,
        school_id: data.school_id,
        tenant_id: data.tenant_id,
        assigned_teacher_id: data.assigned_teacher_id,
        status: data.status || 'draft',
        diagnosis_data: data.diagnosis_data || {},
        planning_data: data.planning_data || {},
        evaluation_data: data.evaluation_data || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Gravar auditoria
    if (pei) {
      await auditMiddleware.logCreate(
        data.tenant_id,
        'pei',
        pei.id,
        {
          source: 'create_pei',
          student_id: data.student_id,
          status: pei.status,
        }
      ).catch(err => console.error('Erro ao gravar auditoria de criação de PEI:', err));
    }

    return pei;
  },

  /**
   * Atualiza um PEI existente
   */
  async updatePEI(peiId: string, updates: UpdatePEIData) {
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('peis')
      .select('*')
      .eq('id', peiId)
      .single();

    const { data: pei, error } = await supabase
      .from('peis')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', peiId)
      .select()
      .single();

    if (error) throw error;

    // Gravar auditoria
    if (pei && oldData) {
      await auditMiddleware.logUpdate(
        pei.tenant_id,
        'pei',
        peiId,
        oldData as Record<string, unknown>,
        pei as Record<string, unknown>,
        updates.status ? `Status alterado para ${updates.status}` : 'PEI atualizado'
      ).catch(err => console.error('Erro ao gravar auditoria de atualização de PEI:', err));
    }

    return pei;
  },

  /**
   * Aprova um PEI
   */
  async approvePEI(peiId: string) {
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('peis')
      .select('*')
      .eq('id', peiId)
      .single();

    const { data: pei, error } = await supabase
      .from('peis')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', peiId)
      .select()
      .single();

    if (error) throw error;

    // Gravar auditoria
    if (pei && oldData) {
      await auditMiddleware.logUpdate(
        pei.tenant_id,
        'pei',
        peiId,
        { status: oldData.status },
        { status: 'approved' },
        'PEI aprovado'
      ).catch(err => console.error('Erro ao gravar auditoria de aprovação de PEI:', err));
    }

    return pei;
  },

  /**
   * Devolve um PEI para revisão
   */
  async returnPEI(peiId: string, reason?: string) {
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('peis')
      .select('*')
      .eq('id', peiId)
      .single();

    const { data: pei, error } = await supabase
      .from('peis')
      .update({ 
        status: 'returned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', peiId)
      .select()
      .single();

    if (error) throw error;

    // Gravar auditoria
    if (pei && oldData) {
      await auditMiddleware.logUpdate(
        pei.tenant_id,
        'pei',
        peiId,
        { status: oldData.status },
        { status: 'returned' },
        reason ? `PEI devolvido: ${reason}` : 'PEI devolvido para revisão'
      ).catch(err => console.error('Erro ao gravar auditoria de devolução de PEI:', err));
    }

    return pei;
  },

  /**
   * Deleta um PEI (soft delete)
   */
  async deletePEI(peiId: string) {
    // Buscar dados do PEI antes de deletar para auditoria
    const { data: peiData } = await supabase
      .from('peis')
      .select('tenant_id, student_id, status')
      .eq('id', peiId)
      .single();

    const { error } = await supabase
      .from('peis')
      .update({ 
        status: 'obsolete',
        updated_at: new Date().toISOString(),
      })
      .eq('id', peiId);

    if (error) throw error;

    // Gravar auditoria
    if (peiData?.tenant_id) {
      await auditMiddleware.logDelete(
        peiData.tenant_id,
        'pei',
        peiId,
        {
          source: 'delete_pei',
          student_id: peiData.student_id,
          previous_status: peiData.status,
          action: 'soft_delete',
        }
      ).catch(err => console.error('Erro ao gravar auditoria de exclusão de PEI:', err));
    }
  },
};

