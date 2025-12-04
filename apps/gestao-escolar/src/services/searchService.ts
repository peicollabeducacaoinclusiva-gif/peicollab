import { supabase } from '@pei/database';

export type SearchResultType = 'student' | 'class' | 'professional' | 'pei' | 'aee' | 'activity' | 'report';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  relevance: number;
}

export interface SearchOptions {
  tenantId?: string;
  schoolId?: string;
  limit?: number;
  types?: SearchResultType[];
}

export const searchService = {
  /**
   * Busca global unificada
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase.rpc('global_search', {
      p_query: query.trim(),
      p_tenant_id: options.tenantId || null,
      p_school_id: options.schoolId || null,
      p_limit: options.limit || 20,
    });

    if (error) {
      console.error('Erro na busca:', error);
      return [];
    }

    // Filtrar por tipos se especificado
    let results = (data || []) as SearchResult[];

    if (options.types && options.types.length > 0) {
      results = results.filter((r) => options.types!.includes(r.type));
    }

    return results;
  },

  /**
   * Busca rápida (limitada a 5 resultados)
   */
  async quickSearch(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    return this.search(query, { ...options, limit: 5 });
  },

  /**
   * Busca por tipo específico
   */
  async searchByType(
    query: string,
    type: SearchResultType,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.search(query, { ...options, types: [type] });
  },
};

