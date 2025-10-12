import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PendingChangesService } from '@/services/pendingChangesService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudUpload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function PendingChangesIndicator() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkPendingChanges();
    
    // Atualiza a cada 30 segundos
    const interval = setInterval(checkPendingChanges, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkPendingChanges = async () => {
    const count = await PendingChangesService.getPendingCount();
    setPendingCount(count);
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast.warning('Você está offline', {
        description: 'Conecte-se para sincronizar as mudanças.',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await PendingChangesService.syncPendingChanges();
      
      if (result.failed === 0) {
        toast.success(`${result.success} mudanças sincronizadas!`);
      } else {
        toast.warning(
          `${result.success} sincronizadas, ${result.failed} falharam`
        );
      }
      
      await checkPendingChanges();
    } catch (error) {
      toast.error('Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-card p-4 rounded-lg shadow-lg border space-y-2">
      <div className="flex items-center gap-2">
        <CloudUpload className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Mudanças Pendentes</span>
        <Badge variant="secondary">{pendingCount}</Badge>
      </div>

      <Button 
        onClick={handleSync} 
        disabled={!isOnline || isSyncing}
        size="sm"
        className="w-full"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
      </Button>
    </div>
  );
}