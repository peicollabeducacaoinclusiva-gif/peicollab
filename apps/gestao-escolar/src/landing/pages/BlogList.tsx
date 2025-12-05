import { useBlogPosts } from '../hooks/useBlogPosts';
import { BlogPostCard } from '../components/BlogPostCard';
import { Loader2, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Página pública de lista de posts do blog
 */
export default function BlogList() {
  const { posts, loading } = useBlogPosts({ limit: 20 });
  
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
            <Link to="/" className="text-sm hover:underline">
              Início
            </Link>
            <Link to="/login" className="text-sm hover:underline">
              Login
            </Link>
          </div>
        </div>
      </header>
      
      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Newspaper className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Blog e Notícias</h1>
              <p className="text-muted-foreground mt-2">
                Últimas novidades e artigos sobre educação inclusiva
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Nenhum post publicado</h2>
              <p className="text-muted-foreground">
                Volte em breve para ver nossos conteúdos!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map(post => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
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

