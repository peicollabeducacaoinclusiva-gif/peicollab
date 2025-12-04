// ============================================================================
// COMPONENTE: NotificationsList
// ============================================================================
// Lista de notificações com ações (marcar como lida, descartar)
// ============================================================================

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  useUnreadNotifications, 
  useMarkAsRead, 
  useDismissNotification,
  useMarkAllAsRead,
  type AEENotification 
} from '@/hooks/useNotifications';

export function NotificationsList() {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useUnreadNotifications();
  const markAsRead = useMarkAsRead();
  const dismiss = useDismissNotification();
  const markAllAsRead = useMarkAllAsRead();
  
  const groupedNotifications = useMemo(() => {
    if (!notifications) return { urgente: [], alta: [], media: [], baixa: [] };
    
    return {
      urgente: notifications.filter(n => n.priority === 'urgente'),
      alta: notifications.filter(n => n.priority === 'alta'),
      media: notifications.filter(n => n.priority === 'media'),
      baixa: notifications.filter(n => n.priority === 'baixa'),
    };
  }, [notifications]);
  
  const handleNotificationClick = async (notification: AEENotification) => {
    // Marcar como lida
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }
    
    // Navegar para ação (se existir)
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };
  
  const handleDismiss = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await dismiss.mutateAsync(notificationId);
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };
  
  const getPriorityIcon = (priority: string) => {
    const icons: Record<string, string> = {
      urgente: '🔴',
      alta: '🟠',
      media: '🟡',
      baixa: '🔵',
    };
    return icons[priority] || '⚪';
  };
  
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      cycle_ending: '⏰',
      low_attendance: '⚠️',
      pending_review: '📝',
      referral_no_response: '🔔',
      visit_follow_up: '📅',
      goal_deadline: '🎯',
      plan_expiring: '📆',
      missing_documentation: '📄',
    };
    return icons[type] || '📬';
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Carregando notificações...</div>;
  }
  
  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">✅</div>
        <p>Nenhuma notificação pendente!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Notificações ({notifications.length})
        </h3>
        <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
          Marcar todas como lidas
        </Button>
      </div>
      
      {/* Notificações Urgentes */}
      {groupedNotifications.urgente.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-2">
            🔴 Urgentes ({groupedNotifications.urgente.length})
          </h4>
          <div className="space-y-2">
            {groupedNotifications.urgente.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDismiss={(e) => handleDismiss(e, notification.id)}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Notificações Alta Prioridade */}
      {groupedNotifications.alta.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-orange-600 mb-2">
            🟠 Alta Prioridade ({groupedNotifications.alta.length})
          </h4>
          <div className="space-y-2">
            {groupedNotifications.alta.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDismiss={(e) => handleDismiss(e, notification.id)}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Notificações Média Prioridade */}
      {groupedNotifications.media.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-yellow-600 mb-2">
            🟡 Média Prioridade ({groupedNotifications.media.length})
          </h4>
          <div className="space-y-2">
            {groupedNotifications.media.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDismiss={(e) => handleDismiss(e, notification.id)}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Notificações Baixa Prioridade */}
      {groupedNotifications.baixa.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">
            🔵 Baixa Prioridade ({groupedNotifications.baixa.length})
          </h4>
          <div className="space-y-2">
            {groupedNotifications.baixa.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDismiss={(e) => handleDismiss(e, notification.id)}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para item de notificação
function NotificationItem({
  notification,
  onClick,
  onDismiss,
  getPriorityIcon,
  getTypeIcon,
}: {
  notification: AEENotification;
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
  getPriorityIcon: (priority: string) => string;
  getTypeIcon: (type: string) => string;
}) {
  const priorityColors: Record<string, string> = {
    urgente: 'border-red-300 bg-red-50',
    alta: 'border-orange-300 bg-orange-50',
    media: 'border-yellow-300 bg-yellow-50',
    baixa: 'border-blue-300 bg-blue-50',
  };
  
  return (
    <div
      className={`border-l-4 p-4 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${priorityColors[notification.priority] || 'border-gray-300 bg-gray-50'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getTypeIcon(notification.notification_type)}</span>
            <h5 className="font-semibold text-sm">{notification.title}</h5>
          </div>
          <p className="text-sm text-gray-700">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="ml-2"
        >
          ✕
        </Button>
      </div>
      {notification.action_label && (
        <div className="mt-2">
          <Button size="sm" variant="outline">
            {notification.action_label} →
          </Button>
        </div>
      )}
    </div>
  );
}


