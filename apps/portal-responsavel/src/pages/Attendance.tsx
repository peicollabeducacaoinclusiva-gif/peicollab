import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useToast } from '@/components/ui';
import { ArrowLeft, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Attendance() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, rate: 0 });

  useEffect(() => {
    if (id) {
      loadAttendance();
    }
  }, [id]);

  async function loadAttendance() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', id)
        .order('data', { ascending: false })
        .limit(60);

      if (error) throw error;

      setAttendance(data || []);

      const total = data?.length || 0;
      const present = data?.filter(a => a.presenca).length || 0;
      const absent = total - present;
      const rate = total > 0 ? (present / total) * 100 : 0;

      setStats({ total, present, absent, rate });
    } catch (error: any) {
      console.error('Erro ao carregar frequência:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar frequência',
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
          <h1 className="text-3xl font-bold text-foreground">Frequência Escolar</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Presentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.present}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faltas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.absent}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Frequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats.rate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Frequência */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Frequência</CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum registro de frequência encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">
                          {format(new Date(record.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        {record.justificativa && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Justificativa: {record.justificativa}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={record.presenca ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {record.presenca ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Presente
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Faltou
                        </>
                      )}
                    </Badge>
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

