'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentRating } from '@/hooks/useDocumentRating';

type DocumentRatingProps = {
  documentId: string | undefined;
};

export function DocumentRating({ documentId }: DocumentRatingProps) {
  const { stats, loading, setRating } = useDocumentRating(documentId);

  if (!documentId || loading) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <span className="text-sm font-medium">Avaliar documento:</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((r) => (
          <Button
            key={r}
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => setRating(r)}
            aria-label={`Avaliar ${r} estrela${r > 1 ? 's' : ''}`}
          >
            <Star
              className={`h-5 w-5 ${
                stats?.userRating != null && r <= stats.userRating
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
        ))}
      </div>
      {stats && stats.countRatings > 0 && (
        <span className="text-xs text-muted-foreground">
          Média: {stats.avgRating} ({stats.countRatings} avaliação
          {stats.countRatings !== 1 ? 'ões' : ''})
        </span>
      )}
    </div>
  );
}
