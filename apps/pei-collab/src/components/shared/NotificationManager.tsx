import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/hooks/use-toast';

interface NotificationManagerProps {
  className?: string;
}

export function NotificationManager({ className = '' }: NotificationManagerProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    peiUpdates: true,
    newPEIs: true,
    familyTokens: true,
    syncStatus: true,
    offlineMode: true
  });

  const { 
    requestPermission, 
    showNotification, 
    subscribeToPush, 
    unsubscribeFromPush, 
    isPermissionGranted 
  } = useNotifications();

  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se já está inscrito para notificações push
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Erro ao verificar status da subscription:', error);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const permission = await requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Permissão Concedida",
          description: "Notificações foram habilitadas com sucesso!",
        });
      } else if (permission === 'denied') {
        toast({
          title: "Permissão Negada",
          description: "As notificações foram bloqueadas. Você pode habilitá-las nas configurações do navegador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar permissão para notificações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeToPush = async () => {
    setIsLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        setIsSubscribed(true);
        toast({
          title: "Inscrito com Sucesso",
          description: "Você receberá notificações push mesmo quando o app estiver fechado.",
        });
      }
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      toast({
        title: "Erro na Inscrição",
        description: "Não foi possível inscrever para notificações push.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        toast({
          title: "Desinscrito",
          description: "Você não receberá mais notificações push.",
        });
      }
    } catch (error) {
      console.error('Erro ao desinscrever:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desinscrever das notificações push.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showNotification({
        title: 'Teste de Notificação',
        body: 'Esta é uma notificação de teste do PEI Collab!',
        tag: 'test-notification',
        data: { type: 'test' }
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
    }
  };

  const handleSettingChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const getPermissionStatus = () => {
    if (!('Notification' in window)) {
      return { status: 'unsupported', icon: XCircle, color: 'text-red-500' };
    }

    const permission = Notification.permission;
    switch (permission) {
      case 'granted':
        return { status: 'granted', icon: CheckCircle, color: 'text-green-500' };
      case 'denied':
        return { status: 'denied', icon: XCircle, color: 'text-red-500' };
      default:
        return { status: 'default', icon: AlertTriangle, color: 'text-yellow-500' };
    }
  };

  const permissionStatus = getPermissionStatus();
  const PermissionIcon = permissionStatus.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status das Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Status das Notificações
          </CardTitle>
          <CardDescription>
            Gerencie suas preferências de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da Permissão */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <PermissionIcon className={`h-5 w-5 ${permissionStatus.color}`} />
              <div>
                <h3 className="font-medium">Permissão do Navegador</h3>
                <p className="text-sm text-muted-foreground">
                  {permissionStatus.status === 'granted' && 'Notificações permitidas'}
                  {permissionStatus.status === 'denied' && 'Notificações bloqueadas'}
                  {permissionStatus.status === 'default' && 'Permissão não solicitada'}
                  {permissionStatus.status === 'unsupported' && 'Navegador não suporta notificações'}
                </p>
              </div>
            </div>
            <Badge variant={permissionStatus.status === 'granted' ? 'default' : 'secondary'}>
              {permissionStatus.status}
            </Badge>
          </div>

          {/* Status da Inscrição Push */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-medium">Notificações Push</h3>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed ? 'Inscrito para notificações push' : 'Não inscrito para notificações push'}
                </p>
              </div>
            </div>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {isSubscribed ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Status da Conexão */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <div>
                <h3 className="font-medium">Status da Conexão</h3>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? 'Conectado à internet' : 'Modo offline'}
                </p>
              </div>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Notificação
          </CardTitle>
          <CardDescription>
            Escolha quais tipos de notificação você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Atualizações de PEI</h3>
                <p className="text-sm text-muted-foreground">
                  Notificar quando o status de um PEI for alterado
                </p>
              </div>
              <Switch
                checked={notificationSettings.peiUpdates}
                onCheckedChange={() => handleSettingChange('peiUpdates')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Novos PEIs</h3>
                <p className="text-sm text-muted-foreground">
                  Notificar quando um novo PEI for criado
                </p>
              </div>
              <Switch
                checked={notificationSettings.newPEIs}
                onCheckedChange={() => handleSettingChange('newPEIs')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Tokens Familiares</h3>
                <p className="text-sm text-muted-foreground">
                  Notificar quando tokens de acesso familiar forem gerados
                </p>
              </div>
              <Switch
                checked={notificationSettings.familyTokens}
                onCheckedChange={() => handleSettingChange('familyTokens')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Status de Sincronização</h3>
                <p className="text-sm text-muted-foreground">
                  Notificar quando a sincronização for concluída
                </p>
              </div>
              <Switch
                checked={notificationSettings.syncStatus}
                onCheckedChange={() => handleSettingChange('syncStatus')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Modo Offline</h3>
                <p className="text-sm text-muted-foreground">
                  Notificar quando entrar ou sair do modo offline
                </p>
              </div>
              <Switch
                checked={notificationSettings.offlineMode}
                onCheckedChange={() => handleSettingChange('offlineMode')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>
            Gerencie suas notificações e teste o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isPermissionGranted() && (
              <Button
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Solicitar Permissão
              </Button>
            )}

            {isPermissionGranted() && !isSubscribed && (
              <Button
                onClick={handleSubscribeToPush}
                disabled={isLoading}
                className="w-full"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Ativar Push Notifications
              </Button>
            )}

            {isSubscribed && (
              <Button
                onClick={handleUnsubscribeFromPush}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <BellOff className="h-4 w-4 mr-2" />
                Desativar Push Notifications
              </Button>
            )}

            {isPermissionGranted() && (
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Testar Notificação
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


