import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Check, 
  X, 
  Trash2, 
  Settings,
  Mail,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowLeft,
  FileText,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  user_id: string;
  pei_id: string | null;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  pei?: {
    id: string;
    student_id: string;
    status: string;
    students: {
      name: string;
    };
  };
}

export default function Notifications() {
  const navigate = useNavigate();
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Carregar notificações do banco com informações do PEI e aluno
      const { data, error } = await supabase
        .from('pei_notifications')
        .select(`
          id,
          user_id,
          pei_id,
          notification_type,
          is_read,
          created_at,
          read_at,
          peis (
            id,
            student_id,
            status,
            students (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setNotifications(data || []);
      
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

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pei_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true, read_at: new Date().toISOString() } : notif
        )
      );
    } catch (error: any) {
      console.error('Erro ao marcar notificação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('pei_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      
      toast({
        title: "Notificações marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas",
      });
    } catch (error: any) {
      console.error('Erro ao marcar todas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações.",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pei_notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      toast({
        title: "Notificação removida",
        description: "A notificação foi removida com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao deletar notificação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a notificação.",
        variant: "destructive",
      });
    }
  };

  const clearAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('pei_notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);
      
      if (error) throw error;
      
      setNotifications(prev => prev.filter(notif => !notif.is_read));
      
      toast({
        title: "Notificações limpas",
        description: "Todas as notificações lidas foram removidas",
      });
    } catch (error: any) {
      console.error('Erro ao limpar notificações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar as notificações.",
        variant: "destructive",
      });
    }
  };

  const getNotificationDetails = (notif: Notification) => {
    const studentName = notif.pei?.students?.name || 'Aluno';
    
    const typeMap: Record<string, { title: string; message: string; icon: any; color: string; badge: any }> = {
      'pei_created': {
        title: 'Novo PEI Atribuído',
        message: `Você foi atribuído como responsável pelo PEI de ${studentName}.`,
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        color: 'bg-blue-50 border-blue-200',
        badge: <Badge variant="secondary">Novo</Badge>
      },
      'pei_approved': {
        title: 'PEI Aprovado',
        message: `O PEI de ${studentName} foi aprovado pela coordenação.`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        color: 'bg-green-50 border-green-200',
        badge: <Badge className="bg-green-500">Aprovado</Badge>
      },
      'pei_returned': {
        title: 'PEI Retornado para Revisão',
        message: `O PEI de ${studentName} foi retornado e precisa de ajustes.`,
        icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
        color: 'bg-orange-50 border-orange-200',
        badge: <Badge variant="outline" className="border-orange-500 text-orange-600">Ação Necessária</Badge>
      },
      'pei_comment': {
        title: 'Novo Comentário',
        message: `Um novo comentário foi adicionado ao PEI de ${studentName}.`,
        icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
        color: 'bg-purple-50 border-purple-200',
        badge: <Badge variant="secondary">Comentário</Badge>
      },
      'teacher_assigned': {
        title: 'Professor Atribuído',
        message: `Um novo professor foi atribuído ao aluno ${studentName}.`,
        icon: <UserPlus className="h-5 w-5 text-blue-500" />,
        color: 'bg-blue-50 border-blue-200',
        badge: <Badge variant="secondary">Atribuição</Badge>
      }
    };
    
    return typeMap[notif.notification_type] || {
      title: 'Notificação',
      message: notif.notification_type,
      icon: <Info className="h-5 w-5 text-gray-500" />,
      color: 'bg-gray-50 border-gray-200',
      badge: <Badge variant="secondary">Info</Badge>
    };
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando notificações...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Navegação */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''}
                  {unreadCount > 0 && ` · ${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Marcar Todas como Lidas</span>
                </Button>
              )}
              <Button variant="outline" onClick={clearAllRead} size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Limpar Lidas</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 space-y-6">

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
              Fique atualizado sobre mudanças nos PEIs e ações importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
                <p className="text-muted-foreground">
                  Você está em dia! Não há notificações no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const details = getNotificationDetails(notification);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        !notification.is_read 
                          ? details.color + ' dark:bg-opacity-10' 
                          : 'bg-card border-border'
                      } ${notification.pei_id ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (notification.pei_id) {
                          markAsRead(notification.id);
                          navigate(`/pei/edit?id=${notification.pei_id}`);
                        }
                      }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {details.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`font-semibold text-base ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {details.title}
                            </h3>
                            <p className={`text-sm mt-1 ${!notification.is_read ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                              {details.message}
                            </p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {details.badge}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {!notification.is_read && (
                                <Badge variant="outline" className="text-xs">
                                  Nova
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsRead(notification.id)}
                                title="Marcar como lida"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotification(notification.id)}
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
