import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';

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
}

interface UsePublicBlogPostsOptions {
  limit?: number;
  offset?: number;
  tenantId?: string;
}

/**
 * Hook para buscar posts publicados do blog (acesso público)
 * Não requer autenticação
 */
export function usePublicBlogPosts({ 
  limit = 10, 
  offset = 0,
  tenantId = '00000000-0000-0000-0000-000000000001' // Tenant padrão/principal
}: UsePublicBlogPostsOptions = {}) {
  
  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ['public-blog-posts', tenantId, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_published_posts', { 
          p_tenant_id: tenantId,
          p_limit: limit,
          p_offset: offset,
        });
      
      if (error) {
        console.error('Erro ao buscar posts do blog:', error);
        return [];
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos (antes era cacheTime)
  });
  
  return { 
    posts: posts || [],
    loading: isLoading,
    error,
  };
}

/**
 * Hook para buscar um post específico por slug (acesso público)
 */
export function usePublicBlogPost(
  slug: string | undefined,
  tenantId: string = '00000000-0000-0000-0000-000000000001'
) {
  const { data: post, isLoading, error } = useQuery<BlogPostFull | null>({
    queryKey: ['public-blog-post', tenantId, slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .rpc('get_post_by_slug', { 
          p_tenant_id: tenantId,
          p_slug: slug,
        });
      
      if (error) {
        console.error('Erro ao buscar post:', error);
        return null;
      }
      
      // Incrementar views
      if (data?.[0]?.id) {
        await supabase
          .from('blog_posts')
          .update({ views_count: (data[0].views_count || 0) + 1 })
          .eq('id', data[0].id);
      }
      
      return data?.[0] || null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
  
  return { 
    post,
    loading: isLoading,
    error,
  };
}

