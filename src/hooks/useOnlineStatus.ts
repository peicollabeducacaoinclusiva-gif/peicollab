import { useEffect, useState } from 'react';

/**
 * Hook que monitora o status de conexão com a internet
 * @returns {boolean} true se online, false se offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      console.log('✅ Conexão restabelecida');
    }

    function handleOffline() {
      setIsOnline(false);
      console.log('❌ Conexão perdida');
    }

    // Adiciona listeners para eventos de online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup: remove listeners quando o componente desmontar
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}