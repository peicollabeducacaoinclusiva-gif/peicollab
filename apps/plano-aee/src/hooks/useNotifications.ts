// ============================================================================
// HOOK: useNotifications
// ============================================================================
// Hook React Query para gerenciar notificações do AEE
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AEENotification {
  id: string;
  tenant_id: string;
  user_id: string;
  notification_type: 
    | 'cycle_ending'
    | 'low_attendance'
    | 'pending_review'
    | 'referral_no_response'
    | 'visit_follow_up'
    | 'goal_deadline'
    | 'plan_expiring'
    | 'missing_documentation';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  plan_id?: string;
  student_id?: string;
  cycle_id?: string;
  referral_id?: string;
  visit_id?: string;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  is_dismissed: boolean;
  dismissed_at?: string;
  created_at: string;
  expires_at: string;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Busca todas as notificações do usuário logado
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aee_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AEENotification[];
    },
  });
}

/**
 * Busca apenas notificações não lidas
 */
export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aee_notifications')
        .select('*')
        .eq('is_read', false)
        .eq('is_dismissed', false)
        .order('priority', { ascending: true }) // urgente primeiro
        .order('created_at', { ascending: false});
      
      if (error) throw error;
      return data as AEENotification[];
    },
  });
}

/**
 * Conta notificações não lidas
 */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'unread', 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('aee_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('is_dismissed', false);
      
      if (error) throw error;
      return count || 0;
    },
  });
}

/**
 * Busca notificações por tipo
 */
export function useNotificationsByType(type: AEENotification['notification_type']) {
  return useQuery({
    queryKey: ['notifications', 'type', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aee_notifications')
        .select('*')
        .eq('notification_type', type)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AEENotification[];
    },
    enabled: !!type,
  });
}

/**
 * Busca notificações de um plano específico
 */
export function usePlanNotifications(planId?: string) {
  return useQuery({
    queryKey: ['notifications', 'plan', planId],
    queryFn: async () => {
      if (!planId) return [];
      
      const { data, error } = await supabase
        .from('aee_notifications')
        .select('*')
        .eq('plan_id', planId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AEENotification[];
    },
    enabled: !!planId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Marca notificação como lida
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('aee_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) throw error;
      return data as AEENotification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Marca todas as notificações como lidas
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('aee_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Descarta (dismisses) uma notificação
 */
export function useDismissNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('aee_notifications')
        .update({ 
          is_dismissed: true, 
          dismissed_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) throw error;
      return data as AEENotification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Deleta notificação (apenas se já lida ou dismissed)
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('aee_notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ============================================================================
// SUBSCRIPTION (Real-time)
// ============================================================================

/**
 * Hook para escutar novas notificações em tempo real
 */
export function useNotificationsSubscription() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['notifications', 'subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'aee_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Invalida cache quando nova notificação chega
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();
      
      return channel;
    },
    staleTime: Infinity, // Mantém a subscription ativa
  });
}

