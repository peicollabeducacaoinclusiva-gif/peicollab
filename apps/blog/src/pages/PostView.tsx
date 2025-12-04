import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, BlogPostWithCategory } from '../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Calendar, Eye, Tag, ArrowLeft } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function PostView() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPostWithCategory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchPost(slug)
    }
  }, [slug])

  const fetchPost = async (slug: string) => {
    try {
      // Buscar post
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug)
        `)
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error) throw error

      setPost(data)

      // Incrementar views
      if (data) {
        await supabase
          .from('blog_posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id)
      }
    } catch (error) {
      console.error('Erro ao carregar post:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando post...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Post não encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              O post que você está procurando não existe ou foi removido.
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao início</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <article className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Voltar */}
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao blog</span>
          </Link>

          {/* Imagem de capa */}
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-96 object-cover rounded-lg shadow-md mb-8"
            />
          )}

          {/* Categoria */}
          {post.category && (
            <div className="flex items-center space-x-1 text-sm text-primary mb-4">
              <Tag className="h-4 w-4" />
              <span className="font-medium">{post.category.name}</span>
            </div>
          )}

          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center space-x-6 text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>{post.views} visualizações</span>
            </div>
          </div>

          {/* Conteúdo */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Autor */}
          {post.author && (
            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-gray-600">
                Escrito por{' '}
                <span className="font-medium text-gray-900">
                  {post.author.full_name || post.author.email}
                </span>
              </p>
            </div>
          )}
        </div>
      </article>

      <Footer />
    </div>
  )
}

