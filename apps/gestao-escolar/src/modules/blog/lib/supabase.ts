import { createClient } from '@supabase/supabase-js'

// Usar Supabase em produção (mesmo que os outros apps)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image?: string
  category_id?: string
  author_id: string
  published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  views: number
}

export type BlogCategory = {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
}

export type BlogPostWithCategory = BlogPost & {
  category?: BlogCategory
  author?: {
    id: string
    email: string
    full_name?: string
  }
}

