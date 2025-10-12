import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm flex items-center justify-center gap-2 z-50">
      <WifiOff className="h-4 w-4" />
      Você está offline. Algumas funcionalidades podem estar limitadas.
    </div>
  );
}