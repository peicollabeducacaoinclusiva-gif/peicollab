import { useState, useEffect } from 'react';
import { useDebounce } from '@pei/ui';
import { searchService, SearchResult } from '../services/searchService';
import { useUserProfile } from './useUserProfile';

export function useGlobalSearch() {
  const { data: userProfile } = useUserProfile();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      searchService
        .search(debouncedQuery, {
          tenantId: userProfile?.tenant_id,
          schoolId: userProfile?.school_id,
        })
        .then((searchResults) => {
          setResults(searchResults);
        })
        .catch((error) => {
          console.error('Erro na busca:', error);
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setResults([]);
    }
  }, [debouncedQuery, userProfile?.tenant_id, userProfile?.school_id]);

  return {
    query,
    setQuery,
    results,
    loading,
  };
}

