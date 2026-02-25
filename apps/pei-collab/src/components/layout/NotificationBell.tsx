'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell() {
  const { items, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(10);

  if (loading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notification-bell">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5 border-b">
          <span className="text-sm font-medium">Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0.5 text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-0.5 py-3 cursor-pointer"
              onClick={() => !n.lida && markAsRead(n.id)}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span
                  className={`text-sm font-medium ${!n.lida ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {n.titulo}
                </span>
                {!n.lida && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
              {n.mensagem && (
                <p className="text-xs text-muted-foreground line-clamp-2">{n.mensagem}</p>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
