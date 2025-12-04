import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
}

export function ResponsiveLayout({ 
  children, 
  className = '',
  mobile = true,
  tablet = true,
  desktop = true
}: ResponsiveLayoutProps) {
  return (
    <div 
      className={cn(
        // Base mobile styles
        mobile && "px-4 py-4 space-y-4",
        // Tablet styles
        tablet && "md:px-6 md:py-6 md:space-y-6",
        // Desktop styles
        desktop && "lg:px-8 lg:py-8 lg:space-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function ResponsiveGrid({ 
  children, 
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}: ResponsiveGridProps) {
  return (
    <div 
      className={cn(
        "grid gap-4",
        // Mobile columns
        cols.mobile && `grid-cols-${cols.mobile}`,
        // Tablet columns
        cols.tablet && `md:grid-cols-${cols.tablet}`,
        // Desktop columns
        cols.desktop && `lg:grid-cols-${cols.desktop}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function ResponsiveCard({ 
  children, 
  className = '',
  padding = { mobile: 'p-4', tablet: 'md:p-6', desktop: 'lg:p-8' }
}: ResponsiveCardProps) {
  return (
    <div 
      className={cn(
        "bg-card rounded-lg border shadow-sm",
        padding.mobile,
        padding.tablet,
        padding.desktop,
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function ResponsiveText({ 
  children, 
  className = '',
  size = { mobile: 'text-sm', tablet: 'md:text-base', desktop: 'lg:text-lg' }
}: ResponsiveTextProps) {
  return (
    <p 
      className={cn(
        size.mobile,
        size.tablet,
        size.desktop,
        className
      )}
    >
      {children}
    </p>
  );
}

interface ResponsiveButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    mobile?: 'sm' | 'default' | 'lg';
    tablet?: 'sm' | 'default' | 'lg';
    desktop?: 'sm' | 'default' | 'lg';
  };
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick?: () => void;
}

export function ResponsiveButton({ 
  children, 
  className = '',
  size = { mobile: 'sm', tablet: 'default', desktop: 'lg' },
  variant = 'default',
  onClick
}: ResponsiveButtonProps) {
  const getSizeClass = (sizeValue: string) => {
    switch (sizeValue) {
      case 'sm': return 'h-8 px-3 text-xs';
      case 'lg': return 'h-12 px-8 text-base';
      default: return 'h-10 px-4 text-sm';
    }
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        // Mobile size
        getSizeClass(size.mobile || 'sm'),
        // Tablet size
        size.tablet && `md:${getSizeClass(size.tablet)}`,
        // Desktop size
        size.desktop && `lg:${getSizeClass(size.desktop)}`,
        // Variant styles
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        variant === 'outline' && 'border border-input hover:bg-accent hover:text-accent-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        variant === 'link' && 'text-primary underline-offset-4 hover:underline',
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}


