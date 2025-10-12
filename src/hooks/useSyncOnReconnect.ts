import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { PendingChangesService } from '@/services/pendingChangesService';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook que sincroniza mudanças pendentes automaticamente ao reconectar
 */
export function useSyncOnReconnect() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOnline) {
      syncChanges();
    }
  }, [isOnline]);

  async function syncChanges() {
    try {
      const pendingCount = await PendingChangesService.getPendingCount();
      
      if (pendingCount === 0) {
        console.log('✅ Nenhuma mudança pendente para sincronizar');
        return;
      }

      toast.loading(`Sincronizando ${pendingCount} mudanças...`, {
        id: 'sync-toast',
      });

      const result = await PendingChangesService.syncPendingChanges();

      if (result.failed === 0) {
        toast.success(`${result.success} mudanças sincronizadas com sucesso!`, {
          id: 'sync-toast',
        });
        
        // Invalida todas as queries para recarregar dados atualizados
        queryClient.invalidateQueries();
      } else {
        toast.warning(
          `${result.success} sincronizadas, ${result.failed} falharam`,
          {
            id: 'sync-toast',
            description: 'Algumas mudanças não puderam ser sincronizadas.',
          }
        );
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar mudanças:', error);
      toast.error('Erro ao sincronizar mudanças', {
        id: 'sync-toast',
      });
    }
  }
}