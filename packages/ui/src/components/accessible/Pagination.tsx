import * as React from 'react';
import { Button } from '../button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  'aria-label'?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  showPageNumbers = true,
  maxVisiblePages = 5,
  'aria-label': ariaLabel = 'Navegação de páginas',
  className,
}) => {
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (currentPage <= halfVisible + 1) {
      // Mostrar primeiras páginas
      for (let i = 1; i <= maxVisiblePages - 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - halfVisible) {
      // Mostrar últimas páginas
      pages.push(1);
      pages.push('ellipsis');
      for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas ao redor da atual
      pages.push(1);
      pages.push('ellipsis');
      for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = totalItems ? (currentPage - 1) * (pageSize || 10) + 1 : undefined;
  const endItem = totalItems
    ? Math.min(currentPage * (pageSize || 10), totalItems)
    : undefined;

  return (
    <nav
      className={cn('flex items-center justify-between', className)}
      aria-label={ariaLabel}
      role="navigation"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          aria-disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Anterior</span>
        </Button>

        {showPageNumbers && (
          <div className="flex items-center gap-1" role="list">
            {pageNumbers.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-1"
                    aria-hidden="true"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </span>
                );
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  aria-label={`Ir para página ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              );
            })}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
          aria-disabled={currentPage === totalPages}
        >
          <span className="sr-only">Próxima</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {totalItems && (
        <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Mostrando {startItem} a {endItem} de {totalItems} itens
        </div>
      )}
    </nav>
  );
};

