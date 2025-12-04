import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pei/ui';
import { Calendar, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BlogPost } from '../hooks/useBlogPosts';

interface BlogPostCardProps {
  post: BlogPost;
}

/**
 * Card de preview de post do blog
 */
export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        {post.featured_image && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}
        
        <CardHeader>
          <CardTitle className="line-clamp-2 text-lg">
            {post.title}
          </CardTitle>
          
          <CardDescription className="line-clamp-3">
            {post.excerpt}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags?.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{post.author_name}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(post.published_at), 'dd MMM yyyy', { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{post.views_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

