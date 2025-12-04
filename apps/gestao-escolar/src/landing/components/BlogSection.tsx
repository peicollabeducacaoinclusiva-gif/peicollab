import { Link } from 'react-router-dom';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { BlogPostCard } from './BlogPostCard';
import { Loader2, Newspaper } from 'lucide-react';

/**
 * Seção de blog/notícias na landing page (acesso público)
 */
export function BlogSection() {
  const { posts, loading } = useBlogPosts({ limit: 3 });
  
  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }
  
  if (!posts || posts.length === 0) {
    return null; // Não exibir seção se não houver posts
  }
  
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Newspaper className="w-8 h-8 text-primary" />
              Notícias e Artigos
            </h2>
            <p className="text-muted-foreground mt-2">
              Fique por dentro das últimas novidades
            </p>
          </div>
          <Link 
            to="/blog" 
            className="text-primary hover:underline font-medium"
          >
            Ver todos os artigos →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

