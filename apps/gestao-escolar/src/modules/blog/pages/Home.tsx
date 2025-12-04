import { useState, useEffect } from 'react'
import { supabase, BlogPostWithCategory } from '../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import { Search, BookOpen } from 'lucide-react'

export default function Home() {
  const [posts, setPosts] = useState<BlogPostWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug)
        `)
        .eq('published', true)
        .order('published_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white py-20">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-xl backdrop-blur-sm mb-6">
            <BookOpen className="h-16 w-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            Blog Educacional
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
            Conteúdo sobre educação inclusiva e o sistema PEI Colaborativo
          </p>
        </div>
      </section>

      {/* Busca */}
      <section className="container mx-auto px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-md p-4 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="container mx-auto px-4 py-12 flex-1">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Nenhum post encontrado
            </h2>
            <p className="text-gray-600">
              {searchTerm
                ? 'Tente buscar com outros termos'
                : 'Aguarde novos conteúdos em breve'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

