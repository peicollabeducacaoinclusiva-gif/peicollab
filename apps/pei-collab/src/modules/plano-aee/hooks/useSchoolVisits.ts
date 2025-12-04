// ============================================================================
// HOOK: useSchoolVisits
// ============================================================================
// Hook React Query para gerenciar visitas escolares
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SchoolVisit } from '../types/planoAEE.types';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Busca todas as visitas de um plano
 */
export function useSchoolVisits(planId?: string) {
  return useQuery({
    queryKey: ['school-visits', planId],
    queryFn: async () => {
      if (!planId) return [];
      
      const { data, error } = await supabase
        .from('aee_school_visits')
        .select('*')
        .eq('plan_id', planId)
        .order('visit_date', { ascending: false });
      
      if (error) throw error;
      return data as SchoolVisit[];
    },
    enabled: !!planId,
  });
}

/**
 * Busca visitas por escola
 */
export function useSchoolVisitsBySchool(schoolId?: string) {
  return useQuery({
    queryKey: ['school-visits', 'school', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      const { data, error } = await supabase
        .from('aee_school_visits')
        .select('*')
        .eq('school_id', schoolId)
        .order('visit_date', { ascending: false });
      
      if (error) throw error;
      return data as SchoolVisit[];
    },
    enabled: !!schoolId,
  });
}

/**
 * Busca uma visita específica
 */
export function useSchoolVisit(visitId?: string) {
  return useQuery({
    queryKey: ['school-visits', visitId],
    queryFn: async () => {
      if (!visitId) return null;
      
      const { data, error } = await supabase
        .from('aee_school_visits')
        .select('*')
        .eq('id', visitId)
        .single();
      
      if (error) throw error;
      return data as SchoolVisit;
    },
    enabled: !!visitId,
  });
}

/**
 * Busca estatísticas de visitas de um plano
 */
export function useVisitsStats(planId?: string) {
  return useQuery({
    queryKey: ['school-visits', 'stats', planId],
    queryFn: async () => {
      if (!planId) return null;
      
      const { data, error } = await supabase
        .rpc('get_plan_visits_stats', { _plan_id: planId });
      
      if (error) throw error;
      return data;
    },
    enabled: !!planId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Cria uma nova visita
 */
export function useCreateSchoolVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (visit: Partial<SchoolVisit>) => {
      const { data, error } = await supabase
        .from('aee_school_visits')
        .insert(visit)
        .select()
        .single();
      
      if (error) throw error;
      return data as SchoolVisit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-visits', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['school-visits', 'stats', data.plan_id] });
    },
  });
}

/**
 * Atualiza uma visita
 */
export function useUpdateSchoolVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SchoolVisit> & { id: string }) => {
      const { data, error } = await supabase
        .from('aee_school_visits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SchoolVisit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-visits', data.id] });
      queryClient.invalidateQueries({ queryKey: ['school-visits', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['school-visits', 'stats', data.plan_id] });
    },
  });
}

/**
 * Deleta uma visita
 */
export function useDeleteSchoolVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      const { error } = await supabase
        .from('aee_school_visits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, planId };
    },
    onSuccess: ({ planId }) => {
      queryClient.invalidateQueries({ queryKey: ['school-visits', planId] });
      queryClient.invalidateQueries({ queryKey: ['school-visits', 'stats', planId] });
    },
  });
}

/**
 * Marca visita como realizada
 */
export function useCompleteVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (visitId: string) => {
      const { data, error } = await supabase
        .from('aee_school_visits')
        .update({ status: 'realizada' })
        .eq('id', visitId)
        .select()
        .single();
      
      if (error) throw error;
      return data as SchoolVisit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-visits', data.id] });
      queryClient.invalidateQueries({ queryKey: ['school-visits', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['school-visits', 'stats', data.plan_id] });
    },
  });
}


