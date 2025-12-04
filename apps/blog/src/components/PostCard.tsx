import { Link } from 'react-router-dom'
import { Calendar, Eye, Tag } from 'lucide-react'
import { formatDate } from '../lib/utils'
import { BlogPostWithCategory } from '../lib/supabase'

interface PostCardProps {
  post: BlogPostWithCategory
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {post.cover_image && (
        <Link to={`/post/${post.slug}`}>
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
          />
        </Link>
      )}
      
      <div className="p-6">
        {/* Categoria */}
        {post.category && (
          <div className="flex items-center space-x-1 text-sm text-primary mb-2">
            <Tag className="h-4 w-4" />
            <span className="font-medium">{post.category.name}</span>
          </div>
        )}

        {/* Título */}
        <Link to={`/post/${post.slug}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{post.views}</span>
            </div>
          </div>
          
          <Link
            to={`/post/${post.slug}`}
            className="text-primary font-medium hover:underline"
          >
            Ler mais →
          </Link>
        </div>
      </div>
    </article>
  )
}

