/**
 * Tipos utilitários compartilhados
 */

// Tipo genérico para responses de API
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

// Tipo para paginação
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipo para filtros genéricos
export interface FilterParams {
  search?: string;
  schoolId?: string;
  tenantId?: string;
  isActive?: boolean;
  [key: string]: any;
}

// Tipo para ordenação
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Timestamps
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

// Auditoria
export interface Auditable extends Timestamps {
  created_by?: string;
  updated_by?: string;
}

// Soft delete
export interface SoftDeletable {
  deleted_at?: string | null;
  deleted_by?: string;
}

