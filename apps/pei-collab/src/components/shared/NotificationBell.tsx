import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  pei_id: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("pei_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Configurar realtime apenas em produção ou se preferir
    const isProduction = import.meta.env.PROD;
    
    if (!isProduction) {
      console.log("🔕 Realtime desabilitado em desenvolvimento");
      // Poll a cada 30 segundos em desenvolvimento
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }

    // Realtime apenas em produção
    const channel = supabase
      .channel("pei_notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pei_notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Conectado ao realtime de notificações");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("pei_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      await loadNotifications();
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    navigate(`/pei/${notification.pei_id}`);
  };

  const getNotificationMessage = (type: string) => {
    const messages: Record<string, string> = {
      pei_updated: "PEI foi atualizado",
      pei_created: "Novo PEI criado",
      pei_assigned: "PEI atribuído a você",
      pei_approved: "PEI foi aprovado",
      pei_returned: "PEI foi devolvido para revisão",
    };
    return messages[type] || "Nova notificação";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
            </p>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                  !notification.is_read ? "bg-accent/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {getNotificationMessage(notification.notification_type)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-1"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;