import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Componente para lazy loading com fallback
 */
export function LazyLoad({ fallback, children }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      {children}
    </Suspense>
  );
}

/**
 * Fallback padrão
 */
function DefaultFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Helper para criar componentes lazy com fallback customizado
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Helper para lazy load de rotas
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}

