import { useCallback, useRef } from 'react';

/**
 * Hook para memoizar callbacks com dependências
 * Útil para evitar re-renderizações desnecessárias
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    deps
  );
}

