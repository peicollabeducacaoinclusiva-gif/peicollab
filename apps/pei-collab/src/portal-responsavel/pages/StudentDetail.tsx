import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, BookOpen, FileText, TrendingUp } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadStudent();
    }
  }, [id]);

  async function loadStudent() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          schools:school_id(school_name),
          classes:class_id(class_name, grade, shift)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setStudent(data);
    } catch (error: any) {
      console.error('Erro ao carregar aluno:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar informações do aluno',
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

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aluno não encontrado</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{student.name}</h1>
          <p className="text-muted-foreground mt-1">
            {(student.schools as any)?.school_name || 'N/A'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/students/${id}/attendance`)}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Frequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acompanhe a frequência escolar
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/students/${id}/grades`)}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize notas e avaliações
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/students/${id}/documents`)}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acesse documentos escolares
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="text-foreground">{student.name}</p>
              </div>
              {(student.classes as any)?.class_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turma</p>
                  <p className="text-foreground">{(student.classes as any).class_name}</p>
                </div>
              )}
              {(student.classes as any)?.grade && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Série</p>
                  <p className="text-foreground">{(student.classes as any).grade}</p>
                </div>
              )}
              {(student.classes as any)?.shift && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turno</p>
                  <p className="text-foreground">{(student.classes as any).shift}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

