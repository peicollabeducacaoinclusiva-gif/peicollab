import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Card, CardHeader, CardTitle, CardContent, Button, useToast } from '@/components/ui';
import { BookOpen, Plus } from 'lucide-react';

export default function Enrollments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  async function loadEnrollments() {
    try {
      setLoading(true);
      const token = localStorage.getItem('family_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Buscar student_id do token
      const tokenHash = await hashToken(token);
      const { data: tokenData } = await supabase
        .from('family_access_tokens')
        .select('student_id')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (!tokenData) return;

      // Buscar matrículas
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          schools:school_id(school_name),
          classes:class_id(class_name, grade)
        `)
        .eq('student_id', tokenData.student_id)
        .order('academic_year', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar matrículas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar matrículas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
          <h1 className="text-3xl font-bold text-foreground">Matrículas</h1>
          <p className="text-muted-foreground mt-1">
            Histórico de matrículas e solicitações
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Matrículas</CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma matrícula encontrada
              </p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">
                          {(enrollment.schools as any)?.school_name || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ano Letivo {enrollment.academic_year}
                          {enrollment.grade && ` • ${enrollment.grade}`}
                          {enrollment.class_name && ` • Turma ${enrollment.class_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {enrollment.status === 'active' ? 'Ativa' : 'Inativa'}
                      </p>
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

