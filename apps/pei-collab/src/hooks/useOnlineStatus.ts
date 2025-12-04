import { useState, useEffect } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  lastOnlineTime: number;
  connectionType?: string;
}

export function useOnlineStatus() {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: navigator.onLine,
    isReconnecting: false,
    lastOnlineTime: Date.now()
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isReconnecting: false,
        lastOnlineTime: Date.now()
      }));
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isReconnecting: true
      }));
    };

    // Detectar mudanças na conexão
    const handleConnectionChange = () => {
      if (navigator.onLine) {
        handleOnline();
      } else {
        handleOffline();
      }
    };

    // Detectar tipo de conexão (se disponível)
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setStatus(prev => ({
          ...prev,
          connectionType: connection?.effectiveType || 'unknown'
        }));
      }
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('visibilitychange', handleConnectionChange);

    // Detectar mudanças na conexão
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('visibilitychange', handleConnectionChange);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return status;
}