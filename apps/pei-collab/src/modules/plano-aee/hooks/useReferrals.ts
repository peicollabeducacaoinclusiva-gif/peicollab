// ============================================================================
// HOOK: useReferrals
// ============================================================================
// Hook React Query para gerenciar encaminhamentos especializados
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Referral } from '../types/planoAEE.types';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Busca todos os encaminhamentos de um plano
 */
export function useReferrals(planId?: string) {
  return useQuery({
    queryKey: ['referrals', planId],
    queryFn: async () => {
      if (!planId) return [];
      
      const { data, error } = await supabase
        .from('aee_referrals')
        .select('*')
        .eq('plan_id', planId)
        .order('referral_date', { ascending: false });
      
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!planId,
  });
}

/**
 * Busca encaminhamentos por escola
 */
export function useReferralsBySchool(schoolId?: string) {
  return useQuery({
    queryKey: ['referrals', 'school', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      const { data, error } = await supabase
        .from('aee_referrals')
        .select('*')
        .eq('school_id', schoolId)
        .order('referral_date', { ascending: false });
      
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!schoolId,
  });
}

/**
 * Busca um encaminhamento específico
 */
export function useReferral(referralId?: string) {
  return useQuery({
    queryKey: ['referrals', referralId],
    queryFn: async () => {
      if (!referralId) return null;
      
      const { data, error } = await supabase
        .from('aee_referrals')
        .select('*')
        .eq('id', referralId)
        .single();
      
      if (error) throw error;
      return data as Referral;
    },
    enabled: !!referralId,
  });
}

/**
 * Busca estatísticas de encaminhamentos de um plano
 */
export function useReferralsStats(planId?: string) {
  return useQuery({
    queryKey: ['referrals', 'stats', planId],
    queryFn: async () => {
      if (!planId) return null;
      
      const { data, error } = await supabase
        .rpc('get_plan_referrals_stats', { _plan_id: planId });
      
      if (error) throw error;
      return data;
    },
    enabled: !!planId,
  });
}

/**
 * Busca encaminhamentos pendentes (sem resposta) - para notificações
 */
export function usePendingReferrals(schoolId?: string) {
  return useQuery({
    queryKey: ['referrals', 'pending', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      const { data, error } = await supabase
        .from('aee_referrals')
        .select('*')
        .eq('school_id', schoolId)
        .in('status', ['enviado', 'agendado'])
        .is('specialist_feedback', null)
        .order('urgency_level', { ascending: true }) // urgente primeiro
        .order('referral_date', { ascending: true }); // mais antigos primeiro
      
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!schoolId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Cria um novo encaminhamento
 */
export function useCreateReferral() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (referral: Partial<Referral>) => {
      const { data, error } = await supabase
        .from('aee_referrals')
        .insert(referral)
        .select()
        .single();
      
      if (error) throw error;
      return data as Referral;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referrals', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'stats', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'pending', data.school_id] });
    },
  });
}

/**
 * Atualiza um encaminhamento
 */
export function useUpdateReferral() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Referral> & { id: string }) => {
      const { data, error } = await supabase
        .from('aee_referrals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Referral;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referrals', data.id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'stats', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'pending', data.school_id] });
    },
  });
}

/**
 * Deleta um encaminhamento
 */
export function useDeleteReferral() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      const { error } = await supabase
        .from('aee_referrals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, planId };
    },
    onSuccess: ({ planId }) => {
      queryClient.invalidateQueries({ queryKey: ['referrals', planId] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'stats', planId] });
    },
  });
}

/**
 * Registra retorno do especialista
 */
export function useRegisterFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      referralId,
      feedback,
      diagnosis,
      recommendations,
    }: {
      referralId: string;
      feedback: string;
      diagnosis?: string;
      recommendations?: string;
    }) => {
      const { data, error } = await supabase
        .from('aee_referrals')
        .update({
          specialist_feedback: feedback,
          diagnosis_summary: diagnosis,
          recommendations,
          feedback_received_date: new Date().toISOString(),
          status: 'concluido',
        })
        .eq('id', referralId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Referral;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referrals', data.id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'stats', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'pending', data.school_id] });
    },
  });
}

/**
 * Integra recomendações ao plano de AEE
 */
export function useIntegrateReferralToPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      referralId,
      integrationNotes,
    }: {
      referralId: string;
      integrationNotes: string;
    }) => {
      const { data, error } = await supabase
        .from('aee_referrals')
        .update({
          integrated_to_plan: true,
          integration_notes: integrationNotes,
        })
        .eq('id', referralId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Referral;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referrals', data.id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['referrals', 'stats', data.plan_id] });
    },
  });
}


