import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

/**
 * Componente de skeleton loader para estados de carregamento
 */
export function LoadingSkeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted rounded';

  if (variant === 'card') {
    return (
      <div className={cn('p-6 space-y-4 border rounded-lg', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn(baseClasses, i === 0 ? 'h-4 w-3/4' : 'h-4 w-1/2')} />
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{ height: height || '1rem' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={cn(baseClasses, 'rounded-full', className)}
        style={{
          width: width || height || '40px',
          height: height || width || '40px',
        }}
      />
    );
  }

  // rectangular (default)
  return (
    <div
      className={cn(baseClasses, className)}
      style={{
        width: width || '100%',
        height: height || '100px',
      }}
    />
  );
}
