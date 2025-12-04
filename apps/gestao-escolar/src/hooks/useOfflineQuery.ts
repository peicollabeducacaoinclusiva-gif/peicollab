import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useOnlineStatus } from './useOnlineStatus';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook wrapper para useQuery com tratamento de erro offline
 * @param options - Opções do React Query
 * @returns Query result com tratamento offline
 */
export function useOfflineQuery<TData>(
  options: UseQueryOptions<TData>
) {
  const isOnline = useOnlineStatus();
  
  const query = useQuery({
    ...options,
    enabled: options.enabled !== false && isOnline, // Só executa se online
    retry: (failureCount, _error) => {
      // Não tenta novamente se offline
      if (!navigator.onLine) return false;
      // Usa retry padrão se online
      return failureCount < 1;
    },
    staleTime: 1000 * 60 * 5, // Dados ficam "frescos" por 5 minutos
    gcTime: 1000 * 60 * 30, // Mantém em cache por 30 minutos
  });

  // Mostra aviso se tentar fazer query offline
  useEffect(() => {
    if (!isOnline && query.isError) {
      toast.warning('Dados indisponíveis offline', {
        description: 'Reconecte-se para atualizar as informações.',
      });
    }
  }, [isOnline, query.isError]);

  return query;
}