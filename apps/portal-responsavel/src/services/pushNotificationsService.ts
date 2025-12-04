import { supabase } from '@pei/database';

export interface PushNotificationSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  types: {
    pei_updates?: boolean;
    aee_sessions?: boolean;
    evaluations?: boolean;
    frequency_alerts?: boolean;
    messages?: boolean;
  };
}

export const pushNotificationsService = {
  /**
   * Registra subscription para push notifications
   */
  async registerSubscription(
    subscription: PushSubscription
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    const subscriptionData = {
      user_id: user.id,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh'),
        auth: subscription.getKey('auth'),
      },
    };

    // Armazenar no Supabase (tabela seria criada separadamente)
    // Por enquanto, usar localStorage como fallback
    const subscriptions = JSON.parse(localStorage.getItem('push_subscriptions') || '[]');
    subscriptions.push(subscriptionData);
    localStorage.setItem('push_subscriptions', JSON.stringify(subscriptions));
  },

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notificações não suportadas neste navegador');
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  /**
   * Envia notificação local (para testes)
   */
  async sendLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  },
};

