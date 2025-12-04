import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Grades() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadGrades();
    }
  }, [id]);

  async function loadGrades() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          subjects:subject_id(subject_name),
          evaluations:evaluation_id(title, evaluation_type)
        `)
        .eq('student_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar notas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/students/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Notas e Avaliações</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma nota registrada
              </p>
            ) : (
              <div className="space-y-3">
                {grades.map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-foreground">
                          {(grade.subjects as any)?.subject_name || 'N/A'}
                        </p>
                        {(grade.evaluations as any)?.title && (
                          <Badge variant="outline" className="ml-2">
                            {(grade.evaluations as any).title}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(grade.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {grade.observations && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {grade.observations}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {grade.score?.toFixed(1) || 'N/A'}
                      </p>
                      {grade.max_score && (
                        <p className="text-xs text-muted-foreground">
                          de {grade.max_score.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

