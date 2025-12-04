import { cn } from '../../lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
}

export function SkeletonLoader({ className, count = 1, height = 'h-4' }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-md bg-muted',
            height,
            className
          )}
        />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <SkeletonLoader height="h-6" className="w-3/4" />
      <SkeletonLoader count={2} />
      <SkeletonLoader height="h-4" className="w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLoader key={i} height="h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonLoader key={colIdx} height="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

