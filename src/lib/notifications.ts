import { supabase } from '@/integrations/supabase/client';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.initializeServiceWorker();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        console.log('Service Worker registrado para notificações');
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return this.permission;
    }

    try {
      this.permission = await Notification.requestPermission();
      console.log('Permissão de notificação:', this.permission);
      return this.permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return 'denied';
    }
  }

  public isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  public async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isPermissionGranted()) {
      console.warn('Permissão de notificação não concedida');
      return;
    }

    try {
      if (this.serviceWorkerRegistration) {
        // Usar Service Worker para notificações mais avançadas
        await this.serviceWorkerRegistration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/pwa-192x192.png',
          badge: payload.badge || '/pwa-192x192.png',
          tag: payload.tag,
          data: payload.data,
          actions: payload.actions,
          requireInteraction: payload.requireInteraction || false,
          silent: payload.silent || false,
          vibrate: [200, 100, 200],
          timestamp: Date.now()
        });
      } else {
        // Fallback para notificação básica
        const notification = new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/pwa-192x192.png',
          tag: payload.tag,
          data: payload.data
        });

        // Auto-fechar após 5 segundos
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Erro ao exibir notificação:', error);
    }
  }

  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service Worker não disponível');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      // Salvar subscription no Supabase
      await this.savePushSubscription(subscription);
      
      console.log('Inscrito para notificações push:', subscription);
      return subscription;
    } catch (error) {
      console.error('Erro ao inscrever para notificações push:', error);
      return null;
    }
  }

  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removePushSubscription(subscription);
        console.log('Desinscrito das notificações push');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao desinscrever das notificações push:', error);
      return false;
    }
  }

  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          subscription: subscription.toJSON(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
    }
  }

  private async removePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('subscription->>endpoint', subscription.endpoint);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover subscription:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Métodos específicos para diferentes tipos de notificações
  public async notifyPEIStatusChange(peiId: string, status: string, studentName: string): Promise<void> {
    await this.showNotification({
      title: 'Status do PEI Atualizado',
      body: `O PEI de ${studentName} foi alterado para ${status}`,
      tag: `pei-${peiId}`,
      data: { peiId, type: 'pei_status_change' },
      actions: [
        { action: 'view', title: 'Visualizar PEI' },
        { action: 'dismiss', title: 'Fechar' }
      ]
    });
  }

  public async notifyNewPEI(peiId: string, studentName: string, coordinatorName: string): Promise<void> {
    await this.showNotification({
      title: 'Novo PEI Criado',
      body: `Um novo PEI foi criado para ${studentName} por ${coordinatorName}`,
      tag: `new-pei-${peiId}`,
      data: { peiId, type: 'new_pei' },
      actions: [
        { action: 'review', title: 'Revisar PEI' },
        { action: 'dismiss', title: 'Fechar' }
      ]
    });
  }

  public async notifyFamilyTokenGenerated(tokenId: string, studentName: string): Promise<void> {
    await this.showNotification({
      title: 'Token Familiar Gerado',
      body: `Token de acesso criado para a família de ${studentName}`,
      tag: `token-${tokenId}`,
      data: { tokenId, type: 'family_token' },
      actions: [
        { action: 'copy', title: 'Copiar Link' },
        { action: 'dismiss', title: 'Fechar' }
      ]
    });
  }

  public async notifySyncComplete(syncedItems: number): Promise<void> {
    await this.showNotification({
      title: 'Sincronização Concluída',
      body: `${syncedItems} itens foram sincronizados com sucesso`,
      tag: 'sync-complete',
      data: { type: 'sync_complete' },
      silent: true
    });
  }

  public async notifyOfflineMode(): Promise<void> {
    await this.showNotification({
      title: 'Modo Offline Ativado',
      body: 'Você pode continuar trabalhando sem conexão com a internet',
      tag: 'offline-mode',
      data: { type: 'offline_mode' },
      requireInteraction: true
    });
  }

  public async notifyOnlineMode(): Promise<void> {
    await this.showNotification({
      title: 'Conexão Restaurada',
      body: 'Sincronizando dados com o servidor...',
      tag: 'online-mode',
      data: { type: 'online_mode' }
    });
  }

  // Método para configurar listeners de notificação
  public setupNotificationListeners(): void {
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.addEventListener('notificationclick', (event) => {
        event.notification.close();

        const data = event.notification.data;
        const action = event.action;

        if (action === 'view' && data.peiId) {
          // Abrir PEI específico
          window.open(`/pei/${data.peiId}`, '_blank');
        } else if (action === 'review' && data.peiId) {
          // Abrir para revisão
          window.open(`/coordinator/validation/${data.peiId}`, '_blank');
        } else if (action === 'copy' && data.tokenId) {
          // Copiar token para área de transferência
          navigator.clipboard.writeText(`${window.location.origin}/secure-family?token=${data.tokenId}`);
        }
      });
    }
  }
}

// Instância global do serviço
export const notificationService = NotificationService.getInstance();

// Hook para usar notificações em componentes React
export const useNotifications = () => {
  const requestPermission = () => notificationService.requestPermission();
  const showNotification = (payload: NotificationPayload) => notificationService.showNotification(payload);
  const subscribeToPush = () => notificationService.subscribeToPushNotifications();
  const unsubscribeFromPush = () => notificationService.unsubscribeFromPushNotifications();
  const isPermissionGranted = () => notificationService.isPermissionGranted();

  return {
    requestPermission,
    showNotification,
    subscribeToPush,
    unsubscribeFromPush,
    isPermissionGranted
  };
};


