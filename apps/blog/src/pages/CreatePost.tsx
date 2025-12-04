import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, BlogCategory } from '../lib/supabase'
import Header from '../components/Header'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import { slugify } from '../lib/utils'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function CreatePost() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [published, setPublished] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (autoSlug && title) {
      setSlug(slugify(title))
    }
  }, [title, autoSlug])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          excerpt,
          content,
          cover_image: coverImage || null,
          category_id: categoryId || null,
          author_id: user.id,
          published,
          published_at: published ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (error) throw error

      navigate('/admin')
    } catch (error: any) {
      console.error('Erro ao criar post:', error)
      alert(error.message || 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Cabeçalho */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center space-x-2 text-primary hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Post</h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Digite o título do post"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setAutoSlug(false)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="slug-do-post"
                required
              />
              <button
                type="button"
                onClick={() => {
                  setSlug(slugify(title))
                  setAutoSlug(true)
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Auto
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              URL: /post/{slug || 'slug-do-post'}
            </p>
          </div>

          {/* Resumo */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Resumo *
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Breve descrição do post"
              required
            />
          </div>

          {/* Imagem de Capa */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem de Capa
            </label>
            <input
              id="coverImage"
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {coverImage && (
              <img
                src={coverImage}
                alt="Preview"
                className="mt-2 w-full h-48 object-cover rounded-lg"
              />
            )}
          </div>

          {/* Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo *
            </label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="bg-white"
            />
          </div>

          {/* Publicar */}
          <div className="flex items-center space-x-2">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publicar imediatamente
            </label>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Salvando...' : 'Salvar Post'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

