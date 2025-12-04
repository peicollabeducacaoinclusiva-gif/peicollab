import { useState, useMemo } from 'react';

export interface PaginationConfig {
  pageSize: number;
  initialPage?: number;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface PaginationControls {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export interface UsePaginationReturn<T> {
  paginatedData: T[];
  pagination: PaginationState;
  controls: PaginationControls;
}

/**
 * Hook reutilizável para paginação de dados
 * 
 * @param data - Array de dados a serem paginados
 * @param config - Configuração de paginação (pageSize, initialPage)
 * @returns Objeto com dados paginados, estado de paginação e controles
 * 
 * @example
 * ```tsx
 * const { paginatedData, pagination, controls } = usePagination(students, { pageSize: 20 });
 * 
 * return (
 *   <>
 *     {paginatedData.map(student => ...)}
 *     <Pagination>
 *       <PaginationPrevious onClick={controls.previousPage} />
 *       <PaginationNext onClick={controls.nextPage} />
 *     </Pagination>
 *   </>
 * );
 * ```
 */
export function usePagination<T>(
  data: T[],
  config: PaginationConfig = { pageSize: 50 }
): UsePaginationReturn<T> {
  const { pageSize: initialPageSize, initialPage = 1 } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ajustar página atual se necessário
  const adjustedPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (adjustedPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, adjustedPage, pageSize]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (adjustedPage < totalPages) {
      setCurrentPage(adjustedPage + 1);
    }
  };

  const previousPage = () => {
    if (adjustedPage > 1) {
      setCurrentPage(adjustedPage - 1);
    }
  };

  const reset = () => {
    setCurrentPage(1);
  };

  return {
    paginatedData,
    pagination: {
      currentPage: adjustedPage,
      pageSize,
      totalPages,
      totalItems,
    },
    controls: {
      goToPage,
      nextPage,
      previousPage,
      setPageSize,
      reset,
    },
  };
}

/**
 * Hook para paginação de dados do servidor (com offset/limit)
 * Útil quando os dados vêm paginados do backend
 */
export interface ServerPaginationConfig {
  pageSize: number;
  initialPage?: number;
}

export interface ServerPaginationState {
  currentPage: number;
  pageSize: number;
  offset: number;
  limit: number;
}

export interface UseServerPaginationReturn {
  pagination: ServerPaginationState;
  controls: PaginationControls;
}

export function useServerPagination(
  config: ServerPaginationConfig = { pageSize: 50 }
): UseServerPaginationReturn {
  const { pageSize: initialPageSize, initialPage = 1 } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const offset = (currentPage - 1) * pageSize;
  const limit = pageSize;

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, page));
  };

  const nextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const previousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const reset = () => {
    setCurrentPage(1);
  };

  return {
    pagination: {
      currentPage,
      pageSize,
      offset,
      limit,
    },
    controls: {
      goToPage,
      nextPage,
      previousPage,
      setPageSize,
      reset,
    },
  };
}








