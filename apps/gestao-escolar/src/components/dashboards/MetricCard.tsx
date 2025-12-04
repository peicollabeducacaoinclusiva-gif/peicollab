import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  const TrendIcon = trend?.isPositive
    ? TrendingUp
    : trend?.isPositive === false
    ? TrendingDown
    : Minus;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendIcon
              className={cn(
                'h-3 w-3',
                trend.isPositive
                  ? 'text-green-600'
                  : trend.isPositive === false
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-xs',
                trend.isPositive
                  ? 'text-green-600'
                  : trend.isPositive === false
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              )}
            >
              {trend.value > 0 && '+'}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
