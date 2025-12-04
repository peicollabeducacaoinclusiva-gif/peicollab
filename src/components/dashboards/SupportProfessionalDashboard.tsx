// src/components/dashboards/SupportProfessionalDashboard.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, Calendar, TrendingUp } from "lucide-react";
import { DailyFeedbackForm } from "@/components/support/DailyFeedbackForm";
import { FeedbackHistory } from "@/components/support/FeedbackHistory";
import { PEIViewModal } from "@/components/support/PEIViewModal";
import { useNavigate } from "react-router-dom";

interface AssignedStudent {
  id: string;
  student: {
    id: string;
    name: string;
    class_name: string;
    date_of_birth: string;
  };
  assigned_at: string;
  notes: string | null;
}

interface FeedbackStats {
  total_feedbacks: number;
  this_week: number;
  avg_socialization: number;
  avg_autonomy: number;
  avg_behavior: number;
}

export function SupportProfessionalDashboard() {
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [isPEIModalOpen, setIsPEIModalOpen] = useState(false);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAssignedStudents();
    loadStats();
  }, []);

  const loadAssignedStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar vinculações
      const { data: assignments, error: assignError } = await supabase
        .from('support_professional_students')
        .select('id, assigned_at, notes, student_id')
        .eq('support_professional_id', user.id)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setAssignedStudents([]);
        setIsLoading(false);
        return;
      }

      // Buscar dados dos alunos separadamente
      const studentIds = assignments.map(a => a.student_id);
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, class_name, date_of_birth')
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Combinar dados
      const combined = assignments.map(assignment => {
        const student = students?.find(s => s.id === assignment.student_id);
        return {
          ...assignment,
          student: student || {
            id: assignment.student_id,
            name: 'Aluno não encontrado',
            class_name: 'N/A',
            date_of_birth: '2010-01-01'
          }
        };
      }).filter(a => a.student);

      setAssignedStudents(combined);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast({
        title: "Erro ao carregar alunos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Estatísticas dos últimos 7 dias
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('support_professional_feedbacks')
        .select('*')
        .eq('support_professional_id', user.id);

      if (error) throw error;

      const recentFeedbacks = data?.filter(f => 
        new Date(f.feedback_date) >= weekAgo
      ) || [];

      const calculateAvg = (field: 'socialization_score' | 'autonomy_score' | 'behavior_score') => {
        const scores = data?.map(f => f[field]).filter(Boolean) || [];
        return scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      };

      setStats({
        total_feedbacks: data?.length || 0,
        this_week: recentFeedbacks.length,
        avg_socialization: calculateAvg('socialization_score'),
        avg_autonomy: calculateAvg('autonomy_score'),
        avg_behavior: calculateAvg('behavior_score'),
      });
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleFeedbackSubmitted = () => {
    loadStats();
    toast({
      title: "Feedback registrado",
      description: "O feedback foi salvo com sucesso!",
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard do Profissional de Apoio</h1>
        <p className="text-muted-foreground">
          Acompanhe e registre feedbacks dos alunos sob sua responsabilidade
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alunos Atribuídos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedStudents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alunos sob seu acompanhamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Feedbacks Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_feedbacks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registros realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.this_week || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Feedbacks nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? ((stats.avg_socialization + stats.avg_autonomy + stats.avg_behavior) / 3).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pontuação média geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos Atribuídos</CardTitle>
          <CardDescription>
            Selecione um aluno para registrar feedback ou ver histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum aluno atribuído ainda.</p>
              <p className="text-sm mt-2">
                Entre em contato com o diretor para solicitar atribuições.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedStudents.map((assignment) => {
                if (!assignment.student) return null;
                
                return (
                  <Card
                    key={assignment.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStudent === assignment.student.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedStudent(assignment.student.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{assignment.student.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {assignment.student.class_name || 'Sem turma'}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {calculateAge(assignment.student.date_of_birth)} anos
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(assignment.student.id);
                            setSelectedStudentName(assignment.student.name);
                            setIsPEIModalOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver PEI
                        </Button>
                      </div>
                      {assignment.notes && (
                        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                          {assignment.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Área de Feedback e Histórico */}
      {selectedStudent && (
        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feedback">Registrar Feedback</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            <DailyFeedbackForm
              studentId={selectedStudent}
              onSubmit={handleFeedbackSubmitted}
            />
          </TabsContent>

          <TabsContent value="history">
            <FeedbackHistory studentId={selectedStudent} />
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Visualização do PEI */}
      <PEIViewModal
        studentId={selectedStudent || ""}
        studentName={selectedStudentName}
        isOpen={isPEIModalOpen}
        onClose={() => setIsPEIModalOpen(false)}
      />
    </div>
  );
}

