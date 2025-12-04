import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Badge,
} from '@/components/ui';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { StudentApprovalDialog } from '@/components/StudentApprovalDialog';
import { useToast } from '@/components/ui/use-toast';
import { attendanceService } from '../services/attendanceService';

interface StudentApprovalData {
  student_id: string;
  student_name: string;
  enrollment_id: string;
  class_name: string;
  academic_year: number;
  final_grade: number | null;
  attendance_percentage: number;
  can_approve: boolean;
  approval_reason: string | null;
}

export default function StudentApproval() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<StudentApprovalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentApprovalData | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.tenant_id) {
      if (userProfile.school_id) {
        setSelectedSchool(userProfile.school_id);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (selectedClass && userProfile?.tenant_id) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClass, academicYear, userProfile]);

  async function loadStudents() {
    if (!selectedClass || !userProfile?.tenant_id) return;

    try {
      setLoading(true);

      // Buscar matrículas da turma
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          class_id,
          ano_letivo,
          students!inner(id, name),
          classes!inner(id, class_name)
        `)
        .eq('class_id', selectedClass)
        .eq('ano_letivo', academicYear);

      if (enrollmentsError) throw enrollmentsError;

      // Para cada matrícula, verificar aprovação
      const studentsData: StudentApprovalData[] = [];

      for (const enrollment of enrollments || []) {
        const student = enrollment.students as any;
        const classData = enrollment.classes as any;

        // Verificar aprovação via função RPC
        const approvalResult = await attendanceService.canApproveStudent(
          student.id,
          enrollment.id,
          academicYear
        );

        // Buscar nota final (se houver)
        const { data: finalGrade } = await supabase
          .from('grades')
          .select('grade_value')
          .eq('student_id', student.id)
          .eq('enrollment_id', enrollment.id)
          .eq('period', 'final')
          .single();

        studentsData.push({
          student_id: student.id,
          student_name: student.name,
          enrollment_id: enrollment.id,
          class_name: classData.class_name,
          academic_year: academicYear,
          final_grade: finalGrade?.grade_value || null,
          attendance_percentage: approvalResult.attendance_percentage || 0,
          can_approve: approvalResult.can_approve || false,
          approval_reason: approvalResult.reason || null,
        });
      }

      setStudents(studentsData);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar dados dos alunos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(student: StudentApprovalData) {
    try {
      // Atualizar status da matrícula
      const { error } = await supabase
        .from('enrollments')
        .update({
          status: 'Aprovado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', student.enrollment_id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${student.student_name} foi aprovado com sucesso.`,
      });

      setApprovalDialogOpen(false);
      setSelectedStudent(null);
      await loadStudents();
    } catch (error: any) {
      console.error('Erro ao aprovar aluno:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível aprovar o aluno',
        variant: 'destructive',
      });
    }
  }

  const filteredStudents = students.filter(s =>
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedCount = students.filter(s => s.can_approve).length;
  const pendingCount = students.filter(s => !s.can_approve).length;

  const appUserProfile = userProfile
    ? {
        id: userProfile.tenant_id || '',
        full_name: userProfile.full_name,
        email: userProfile.email,
        role: userProfile.role || 'teacher',
        tenant_id: userProfile.tenant_id,
        network_name: (userProfile.tenant as any)?.network_name || null,
        school_name: (userProfile.school as any)?.school_name || null,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Gestão Escolar"
        appLogo="/logo.png"
        currentApp="gestao-escolar"
        userProfile={appUserProfile as any}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Aprovação de Alunos</h1>
          <p className="text-muted-foreground mt-1">
            Aprovar alunos ao final do ano letivo com validação de frequência
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="school">Escola</Label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger id="school">
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolsData.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class">Turma</Label>
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  disabled={!selectedSchool}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesData?.data
                      ?.filter((c) => c.school_id === selectedSchool && c.academic_year === academicYear.toString())
                      .map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.class_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academicYear">Ano Letivo</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>

              <div>
                <Label htmlFor="search">Buscar Aluno</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome do aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Elegíveis para Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {approvedCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes (Frequência &lt; 75%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {pendingCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Alunos */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando alunos...</p>
            </CardContent>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {selectedClass
                ? 'Nenhum aluno encontrado nesta turma'
                : 'Selecione uma turma para visualizar os alunos'}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Alunos da Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.student_id}
                    className={`p-4 border rounded-lg ${
                      student.can_approve
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{student.student_name}</h3>
                          {student.can_approve ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Elegível
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Turma:</span> {student.class_name}
                          </div>
                          <div>
                            <span className="font-medium">Frequência:</span>{' '}
                            {student.attendance_percentage.toFixed(2)}%
                          </div>
                          <div>
                            <span className="font-medium">Nota Final:</span>{' '}
                            {student.final_grade !== null
                              ? student.final_grade.toFixed(1)
                              : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Ano Letivo:</span> {student.academic_year}
                          </div>
                        </div>
                        {!student.can_approve && student.approval_reason && (
                          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            {student.approval_reason}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={() => {
                            setSelectedStudent(student);
                            setApprovalDialogOpen(true);
                          }}
                          disabled={!student.can_approve}
                          variant={student.can_approve ? 'default' : 'outline'}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Aprovação */}
        {selectedStudent && (
          <StudentApprovalDialog
            open={approvalDialogOpen}
            onOpenChange={setApprovalDialogOpen}
            studentId={selectedStudent.student_id}
            studentName={selectedStudent.student_name}
            enrollmentId={selectedStudent.enrollment_id}
            academicYear={academicYear}
            onApprove={async () => {
              await handleApprove(selectedStudent);
            }}
          />
        )}
      </div>
    </div>
  );
}

