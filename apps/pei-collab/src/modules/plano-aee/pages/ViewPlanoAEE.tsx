import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';;
import { ArrowLeft, Edit, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

export default function ViewPlanoAEE() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [plano, setPlano] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) {
      loadPlano();
      loadComments();
    }
  }, [id]);

  const loadPlano = async () => {
    try {
      const { data, error } = await supabase
        .from('plano_aee')
        .select(`
          *,
          student:students(full_name),
          created_by_user:profiles!created_by(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPlano(data);
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('plano_aee_comments')
        .select(`
          *,
          user:profiles!user_id(full_name)
        `)
        .eq('plano_aee_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('plano_aee_comments').insert({
        plano_aee_id: id,
        user_id: userData.user?.id,
        comment_text: newComment,
      });

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Plano não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Plano de AEE
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Aluno: {plano.student.full_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to={`/edit/${id}`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {plano.school_complaint && (
              <Card>
                <CardHeader>
                  <CardTitle>Queixa da Escola</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">
                    {plano.school_complaint}
                  </p>
                </CardContent>
              </Card>
            )}

            {plano.family_complaint && (
              <Card>
                <CardHeader>
                  <CardTitle>Queixa da Família</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">
                    {plano.family_complaint}
                  </p>
                </CardContent>
              </Card>
            )}

            {plano.family_guidance && (
              <Card>
                <CardHeader>
                  <CardTitle>Orientações para a Família</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">
                    {plano.family_guidance}
                  </p>
                </CardContent>
              </Card>
            )}

            {plano.school_guidance && (
              <Card>
                <CardHeader>
                  <CardTitle>Orientações para a Escola</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">
                    {plano.school_guidance}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Comments */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comentários ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Adicionar comentário..."
                    />
                    <Button
                      onClick={handleAddComment}
                      size="sm"
                      className="w-full"
                    >
                      Comentar
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum comentário ainda
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.user?.full_name || 'Usuário'}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {comment.comment_text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


