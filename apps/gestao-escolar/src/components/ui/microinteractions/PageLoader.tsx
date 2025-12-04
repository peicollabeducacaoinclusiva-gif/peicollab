import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Componente de loader para páginas inteiras
 */
export function PageLoader({
  message = 'Carregando...',
  fullScreen = true,
  className,
}: PageLoaderProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center min-h-[400px]">{content}</div>;
}
