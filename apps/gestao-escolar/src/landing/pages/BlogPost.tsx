import { useParams, Link } from 'react-router-dom';
import { usePublicBlogPost } from '../hooks/usePublicBlogPosts';
import { Loader2, Calendar, User, Eye, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Página pública de visualização de post do blog
 */
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading } = usePublicBlogPost(slug);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80">
              <img src="/logo.png" alt="PEI Collab" className="h-10" />
              <span className="font-bold text-xl">PEI Collab</span>
            </Link>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post não encontrado</h1>
            <Link to="/blog" className="text-primary hover:underline">
              ← Voltar para o blog
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <img src="/logo.png" alt="PEI Collab" className="h-10" />
            <span className="font-bold text-xl">PEI Collab</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/blog" className="text-sm hover:underline">
              Blog
            </Link>
            <Link to="/login" className="text-sm hover:underline">
              Login
            </Link>
          </div>
        </div>
      </header>
      
      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link to="/blog" className="text-primary hover:underline flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para o blog
            </Link>
          </div>
          
          {/* Featured Image */}
          {post.featured_image && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Título */}
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{post.views_count} visualizações</span>
            </div>
          </div>
          
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <span 
                  key={tag}
                  className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Conteúdo */}
          <article 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PEI Collab. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

