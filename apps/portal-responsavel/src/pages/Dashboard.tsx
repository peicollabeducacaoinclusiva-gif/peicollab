import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui';
import { AppHeader } from '@pei/ui';
import { User, Calendar, BookOpen, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Student {
  id: string;
  name: string;
  date_of_birth: string;
  school_name: string;
  class_name: string | null;
  grade: string | null;
  attendance_rate: number | null;
  recent_grades: any[];
  pending_documents: number;
}

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      const token = localStorage.getItem('family_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Buscar token e pegar student_id
      const tokenHash = await hashToken(token);
      const { data: tokenData, error: tokenError } = await supabase
        .from('family_access_tokens')
        .select('student_id, pei_id')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (tokenError || !tokenData) {
        throw new Error('Token inválido');
      }

      // Buscar dados do aluno
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          date_of_birth,
          schools:school_id(school_name),
          class_id,
          classes:class_id(class_name, grade)
        `)
        .eq('id', tokenData.student_id)
        .maybeSingle();

      if (studentError || !studentData) {
        throw new Error('Aluno não encontrado');
      }

      // Buscar frequência recente
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('presenca, data')
        .eq('student_id', studentData.id)
        .order('data', { ascending: false })
        .limit(30);

      const attendanceRate = attendanceData
        ? (attendanceData.filter(a => a.presenca).length / attendanceData.length) * 100
        : null;

      // Buscar notas recentes
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const student: Student = {
        id: studentData.id,
        name: studentData.name,
        date_of_birth: studentData.date_of_birth,
        school_name: (studentData.schools as any)?.school_name || 'N/A',
        class_name: (studentData.classes as any)?.class_name || null,
        grade: (studentData.classes as any)?.grade || null,
        attendance_rate: attendanceRate,
        recent_grades: gradesData || [],
        pending_documents: 0, // TODO: implementar busca de documentos
      };

      setStudents([student]);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar informações',
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
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-50/30 dark:to-pink-950/10">
      <AppHeader
        appName="Portal do Responsável"
        appLogo="/logo.png"
        currentApp="portal-responsavel"
        showInstitutionalLogo={false}
      />

      <div className="container mx-auto px-4 py-6">
        {students.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center mb-6">
                <User className="h-12 w-12 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum aluno vinculado encontrado
              </h3>
              <p className="text-muted-foreground">
                Entre em contato com a escola para vincular seu filho
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {students.map((student, index) => (
              <div key={student.id} className="space-y-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 p-6 sm:p-8 text-white shadow-2xl">
                  <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <User className="h-8 w-8" />
                        </div>
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                            {student.name}
                          </h1>
                          <p className="text-pink-100 text-sm sm:text-base">
                            {student.school_name}
                            {student.class_name && ` • ${student.class_name}`}
                            {student.grade && ` • ${student.grade}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      title: 'Frequência', 
                      value: student.attendance_rate !== null ? `${student.attendance_rate.toFixed(0)}%` : 'N/A',
                      subtitle: 'Taxa de presença',
                      icon: Calendar, 
                      gradient: 'from-blue-500 to-cyan-500', 
                      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
                      onClick: () => navigate(`/students/${student.id}/attendance`),
                      warning: student.attendance_rate !== null && student.attendance_rate < 75,
                      index: 0
                    },
                    { 
                      title: 'Notas Recentes', 
                      value: student.recent_grades.length > 0 ? student.recent_grades[0].score?.toFixed(1) || 'N/A' : 'N/A',
                      subtitle: student.recent_grades.length > 0 ? `${student.recent_grades.length} avaliação(ões)` : 'Sem avaliações',
                      icon: TrendingUp, 
                      gradient: 'from-green-500 to-emerald-500', 
                      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
                      onClick: () => navigate(`/students/${student.id}/grades`),
                      index: 1
                    },
                    { 
                      title: 'Documentos', 
                      value: student.pending_documents,
                      subtitle: 'Documentos disponíveis',
                      icon: FileText, 
                      gradient: 'from-purple-500 to-pink-500', 
                      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
                      onClick: () => navigate(`/students/${student.id}/documents`),
                      index: 2
                    },
                    { 
                      title: 'Matrículas', 
                      value: new Date().getFullYear(),
                      subtitle: 'Ano letivo atual',
                      icon: BookOpen, 
                      gradient: 'from-orange-500 to-amber-500', 
                      bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
                      onClick: () => navigate('/enrollments'),
                      index: 3
                    },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card
                        key={stat.title}
                        className={`stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${stat.bgGradient} cursor-pointer animate-fade-in`}
                        style={{ animationDelay: `${stat.index * 100}ms` }}
                        onClick={stat.onClick}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            {stat.title}
                          </CardTitle>
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                            {stat.value}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{stat.subtitle}</p>
                          {stat.warning && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Atenção: frequência abaixo do recomendado
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Ações Rápidas */}
                <Card className="shadow-xl border-0">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-b">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 hover:bg-pink-50 dark:hover:bg-pink-950/30 hover:border-pink-300 dark:hover:border-pink-700 transition-all"
                        onClick={() => navigate(`/students/${student.id}/attendance`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">Ver Frequência</div>
                            <div className="text-xs text-muted-foreground">Acompanhar presença</div>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-700 transition-all"
                        onClick={() => navigate(`/students/${student.id}/grades`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">Ver Notas</div>
                            <div className="text-xs text-muted-foreground">Acompanhar desempenho</div>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                        onClick={() => navigate(`/students/${student.id}/documents`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">Ver Documentos</div>
                            <div className="text-xs text-muted-foreground">Acessar arquivos</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

