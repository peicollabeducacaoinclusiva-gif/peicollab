import { useEffect } from 'react';
import { useOfflineSync } from './useOfflineSync';

export function useSyncOnReconnect() {
  const { isOnline, pendingChanges, syncData } = useOfflineSync();

  useEffect(() => {
    // Sincronizar automaticamente quando voltar online e houver mudanças pendentes
    if (isOnline && pendingChanges > 0) {
      const timer = setTimeout(() => {
        syncData();
      }, 2000); // Aguarda 2 segundos após voltar online

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingChanges, syncData]);

  // Sincronização periódica (a cada 5 minutos quando online)
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      if (pendingChanges > 0) {
        syncData();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [isOnline, pendingChanges, syncData]);
}
