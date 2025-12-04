import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, BlogPostWithCategory } from '../lib/supabase'
import Header from '../components/Header'
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import { formatDateTime } from '../lib/utils'

export default function Dashboard() {
  const [posts, setPosts] = useState<BlogPostWithCategory[]>([])
  const [loading, setLoading] = useState(true)

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
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id)

      if (error) throw error

      setPosts(posts.filter((post) => post.id !== id))
    } catch (error) {
      console.error('Erro ao excluir post:', error)
      alert('Erro ao excluir post')
    }
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', id)

      if (error) throw error

      fetchPosts()
    } catch (error) {
      console.error('Erro ao atualizar post:', error)
      alert('Erro ao atualizar post')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin />

      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Gerencie seus posts do blog
            </p>
          </div>
          <Link
            to="/admin/post/new"
            className="inline-flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Post</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm">Total de Posts</p>
            <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm">Publicados</p>
            <p className="text-3xl font-bold text-green-600">
              {posts.filter((p) => p.published).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm">Rascunhos</p>
            <p className="text-3xl font-bold text-yellow-600">
              {posts.filter((p) => !p.published).length}
            </p>
          </div>
        </div>

        {/* Lista de Posts */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">Nenhum post criado ainda</p>
            <Link
              to="/admin/post/new"
              className="inline-flex items-center space-x-2 text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              <span>Criar seu primeiro post</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {post.title}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {post.published ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Rascunho
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(post.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            togglePublish(post.id, post.published)
                          }
                          className="p-2 text-gray-600 hover:text-primary transition-colors"
                          title={
                            post.published ? 'Despublicar' : 'Publicar'
                          }
                        >
                          {post.published ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        <Link
                          to={`/admin/post/edit/${post.id}`}
                          className="p-2 text-gray-600 hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

