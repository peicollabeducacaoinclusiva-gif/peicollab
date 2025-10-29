import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Check, 
  X, 
  Trash2, 
  Settings,
  Mail,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export default function Notifications() {
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markAllRead, setMarkAllRead] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Simular carregamento de notificações
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'PEI Aprovado',
          message: 'O PEI do aluno João Silva foi aprovado com sucesso.',
          type: 'success',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/pei/123'
        },
        {
          id: '2',
          title: 'Nova Atribuição',
          message: 'Você foi atribuído como responsável pelo PEI da Maria Santos.',
          type: 'info',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          action_url: '/pei/456'
        },
        {
          id: '3',
          title: 'PEI Retornado',
          message: 'O PEI do Pedro Costa foi retornado para revisão.',
          type: 'warning',
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          action_url: '/pei/789'
        },
        {
          id: '4',
          title: 'Sistema em Manutenção',
          message: 'O sistema passará por manutenção programada amanhã às 2h.',
          type: 'info',
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      setNotifications(mockNotifications);
      
    } catch (error: any) {
      console.error('Erro ao carregar notificações:', error);
      toast({
        title: "Erro ao carregar notificações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast({
      title: "Notificações marcadas como lidas",
      description: "Todas as notificações foram marcadas como lidas",
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast({
      title: "Notificação removida",
      description: "A notificação foi removida com sucesso",
    });
  };

  const clearAllRead = () => {
    setNotifications(prev => prev.filter(notif => !notif.read));
    toast({
      title: "Notificações limpas",
      description: "Todas as notificações lidas foram removidas",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Sucesso</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Aviso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Informação</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando notificações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas notificações e alertas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          )}
          <Button variant="outline" onClick={clearAllRead}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Lidas
          </Button>
        </div>
      </div>

      {/* Configurações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="markAllRead">Marcar todas como lidas automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                As notificações serão marcadas como lidas quando visualizadas
              </p>
            </div>
            <Switch
              id="markAllRead"
              checked={markAllRead}
              onCheckedChange={setMarkAllRead}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Notificações</CardTitle>
          <CardDescription>
            {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} 
            {unreadCount > 0 && ` (${unreadCount} não lida${unreadCount !== 1 ? 's' : ''})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
              <p className="text-muted-foreground">
                Você está em dia! Não há notificações no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${!notification.read ? 'text-blue-700' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getNotificationBadge(notification.type)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
