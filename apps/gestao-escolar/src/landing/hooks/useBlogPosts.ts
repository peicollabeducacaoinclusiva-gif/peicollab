import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { useTenant } from '@/hooks/useTenant';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  author_name: string;
  tags: string[];
  views_count: number;
}

export interface BlogPostFull extends BlogPost {
  content: string;
  author_id: string;
}

interface UseBlogPostsOptions {
  limit?: number;
  offset?: number;
}

/**
 * Hook para buscar posts publicados do blog (acesso público)
 */
export function useBlogPosts({ limit = 10, offset = 0 }: UseBlogPostsOptions = {}) {
  const { tenantId } = useTenant();
  
  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ['blog-posts', tenantId, limit, offset],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .rpc('get_published_posts', { 
          p_tenant_id: tenantId,
          p_limit: limit,
          p_offset: offset,
        });
      
      if (error) {
        console.error('Erro ao buscar posts do blog:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!tenantId,
  });
  
  return { 
    posts: posts || [],
    loading: isLoading,
    error,
  };
}

/**
 * Hook para buscar um post específico por slug
 */
export function useBlogPost(slug: string | undefined) {
  const { tenantId } = useTenant();
  
  const { data: post, isLoading, error } = useQuery<BlogPostFull | null>({
    queryKey: ['blog-post', tenantId, slug],
    queryFn: async () => {
      if (!tenantId || !slug) return null;
      
      const { data, error } = await supabase
        .rpc('get_post_by_slug', { 
          p_tenant_id: tenantId,
          p_slug: slug,
        });
      
      if (error) {
        console.error('Erro ao buscar post:', error);
        throw error;
      }
      
      return data?.[0] || null;
    },
    enabled: !!tenantId && !!slug,
  });
  
  return { 
    post,
    loading: isLoading,
    error,
  };
}

