import { ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Plus, Search, Filter, Download, RefreshCw } from 'lucide-react';

interface StandardListPageProps {
  title: string;
  description?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  onCreate?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  children: ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showCreate?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
}

/**
 * Template padrão para páginas de listagem
 * 
 * Inclui:
 * - Header com título e descrição
 * - Barra de busca
 * - Filtros
 * - Ações (criar, exportar, refresh)
 * - Grid/Lista de itens
 * - Empty state
 */
export function StandardListPage({
  title,
  description,
  searchPlaceholder = 'Buscar...',
  searchValue = '',
  onSearchChange,
  filters,
  actions,
  onCreate,
  onExport,
  onRefresh,
  children,
  emptyState,
  loading = false,
  showSearch = true,
  showFilters = true,
  showCreate = true,
  showExport = false,
  showRefresh = true,
}: StandardListPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            {actions}
            {showRefresh && onRefresh && (
              <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {showExport && onExport && (
              <Button variant="outline" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
            {showCreate && onCreate && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar
              </Button>
            )}
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Barra de Busca e Filtros */}
        {(showSearch || showFilters) && (
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {showSearch && (
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              {showFilters && filters && (
                <div className="flex items-center gap-2 flex-wrap">
                  {filters}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Conteúdo */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : emptyState ? (
          emptyState
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </div>
    </div>
  );
}
