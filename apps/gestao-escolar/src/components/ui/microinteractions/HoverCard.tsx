import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  hoverClassName?: string;
  disabled?: boolean;
}

/**
 * Componente para adicionar efeito hover consistente
 */
export function HoverCard({
  children,
  className,
  hoverClassName = 'hover:shadow-md hover:-translate-y-1',
  disabled = false,
}: HoverCardProps) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-in-out cursor-pointer',
        hoverClassName,
        className
      )}
    >
      {children}
    </div>
  );
}
