'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Notification = {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  created_at: string;
};

export function useNotifications(limit = 10) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchInitial = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, tipo, titulo, mensagem, lida, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error) {
        setItems((data ?? []) as Notification[]);
        setUnreadCount((data ?? []).filter((n: Notification) => !n.lida).length);
      }
      setLoading(false);
    };

    fetchInitial();
  }, [limit]);

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      userId = user?.id ?? null;
      if (!userId) return;

      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            const newRow = payload.new as Notification;
            if (newRow.user_id === userId) {
              setItems((prev) => [newRow, ...prev].slice(0, limit));
              setUnreadCount((c) => c + 1);
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [limit]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ lida: true }).eq('id', id);

    if (!error) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ lida: true })
      .eq('user_id', user.id)
      .eq('lida', false);

    if (!error) {
      setItems((prev) => prev.map((n) => ({ ...n, lida: true })));
      setUnreadCount(0);
    }
  };

  return { items, unreadCount, loading, markAsRead, markAllAsRead };
}
