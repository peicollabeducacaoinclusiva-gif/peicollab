import { SkeletonLoader } from '@pei/ui';

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <SkeletonLoader height="h-8" className="w-64" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-6 space-y-4">
        <SkeletonLoader height="h-6" className="w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <SkeletonLoader height="h-4" className="w-24" />
              <SkeletonLoader height="h-8" className="w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

