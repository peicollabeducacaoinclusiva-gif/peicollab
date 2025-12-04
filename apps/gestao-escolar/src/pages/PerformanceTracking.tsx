import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, BarChart3, Users, Target } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { evaluationService, type Grade, type Attendance } from '../services/evaluationService';
import { supabase } from '@pei/database';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

interface PerformanceData {
  studentId: string;
  studentName: string;
  enrollmentId: string;
  classId: string;
  className: string;
  academicYear: number;
  grades: Grade[];
  attendance: Attendance[];
  average: number;
  attendancePercentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PerformanceTracking() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; subject_name: string }>>([]);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadSubjects();
    }
  }, [userProfile]);

  useEffect(() => {
    if (selectedClass && selectedSubject && userProfile?.tenant_id) {
      loadPerformanceData();
    }
  }, [selectedClass, selectedSubject, academicYear, userProfile]);

  async function loadSubjects() {
    if (!userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  }

  async function loadPerformanceData() {
    if (!selectedClass || !selectedSubject || !userProfile?.tenant_id) return;

    try {
      setLoading(true);

      // Buscar alunos da turma
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          class_id,
          academic_year,
          students:student_id(name),
          classes:class_id(class_name)
        `)
        .eq('class_id', selectedClass)
        .eq('academic_year', academicYear)
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;

      const performance: PerformanceData[] = [];

      for (const enrollment of enrollments || []) {
        // Buscar notas
        const grades = (await evaluationService.getGrades({
          tenantId: userProfile.tenant_id,
          enrollmentId: enrollment.id,
          subjectId: selectedSubject,
          academicYear,
        })) as unknown as Grade[];

        // Buscar frequência
        const attendance = (await evaluationService.getAttendance({
          tenantId: userProfile.tenant_id,
          enrollmentId: enrollment.id,
          subjectId: selectedSubject,
          academicYear,
        })) as unknown as Attendance[];

        // Calcular média
        const numericGrades = grades
          .map(g => g.grade_value)
          .filter((v): v is number => v !== null);
        const average = numericGrades.length > 0
          ? numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length
          : 0;

        // Calcular frequência média
        const attendanceAvg = attendance.length > 0
          ? attendance.reduce((sum, att) => sum + att.attendance_percentage, 0) / attendance.length
          : 0;

        performance.push({
          studentId: enrollment.student_id,
          studentName: (enrollment.students as any)?.name || 'N/A',
          enrollmentId: enrollment.id,
          classId: enrollment.class_id,
          className: (enrollment.classes as any)?.class_name || 'N/A',
          academicYear,
          grades,
          attendance,
          average,
          attendancePercentage: attendanceAvg,
        });
      }

      setPerformanceData(performance);
    } catch (error: any) {
      console.error('Erro ao carregar dados de desempenho:', error);
      toast.error('Erro ao carregar dados de desempenho');
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => {
    return performanceData.map(data => ({
      name: data.studentName,
      média: data.average,
      frequência: data.attendancePercentage,
    }));
  }, [performanceData]);

  const performanceByPeriod = useMemo(() => {
    const periods: Record<number, { period: number; average: number; count: number }> = {};

    performanceData.forEach(data => {
      data.grades.forEach(grade => {
        if (grade.grade_value !== null) {
          if (!periods[grade.period]) {
            periods[grade.period] = { period: grade.period, average: 0, count: 0 };
          }
          const period = periods[grade.period];
          if (period) {
            period.average += grade.grade_value;
            period.count += 1;
          }
        }
      });
    });

    return Object.values(periods).map(p => ({
      período: `${p.period}º Bimestre`,
      média: p.count > 0 ? p.average / p.count : 0,
    }));
  }, [performanceData]);

  const attendanceDistribution = useMemo(() => {
    const ranges = {
      '90-100%': 0,
      '75-89%': 0,
      '50-74%': 0,
      '<50%': 0,
    };

    performanceData.forEach(data => {
      const att = data.attendancePercentage;
      if (att >= 90) ranges['90-100%']++;
      else if (att >= 75) ranges['75-89%']++;
      else if (att >= 50) ranges['50-74%']++;
      else ranges['<50%']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  }, [performanceData]);

  const filteredClasses = classesData?.data?.filter(
    cls => !selectedSchool || cls.school_id === selectedSchool
  ) || [];

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (userProfile.tenant as any)?.network_name || null,
    school_name: (userProfile.school as any)?.school_name || null,
  } : undefined;

  const overallAverage = performanceData.length > 0
    ? performanceData.reduce((sum, d) => sum + d.average, 0) / performanceData.length
    : 0;

  const overallAttendance = performanceData.length > 0
    ? performanceData.reduce((sum, d) => sum + d.attendancePercentage, 0) / performanceData.length
    : 0;

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
          <h1 className="text-3xl font-bold text-foreground">Acompanhamento de Desempenho</h1>
          <p className="text-muted-foreground mt-1">
            Visualize indicadores e gráficos de desempenho por turma
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
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
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
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Disciplina</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="academicYear">Ano Letivo</Label>
                <input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : !selectedClass || !selectedSubject ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Selecione uma turma e disciplina para visualizar os indicadores
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Indicadores Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallAverage.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    {performanceData.length} alunos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Frequência Média</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallAttendance.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {performanceData.length} alunos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {performanceData.filter(d => d.average >= 6.0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {performanceData.length} alunos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Frequência Adequada</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceData.filter(d => d.attendancePercentage >= 75).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {performanceData.length} alunos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="performance">Desempenho</TabsTrigger>
                <TabsTrigger value="attendance">Frequência</TabsTrigger>
                <TabsTrigger value="evolution">Evolução</TabsTrigger>
              </TabsList>

              {/* Gráfico de Desempenho */}
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Desempenho por Aluno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="média" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gráfico de Frequência */}
              <TabsContent value="attendance">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Frequência por Aluno</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="frequência" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição de Frequência</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={attendanceDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {attendanceDistribution.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Evolução por Período */}
              <TabsContent value="evolution">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução da Média por Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceByPeriod.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={performanceByPeriod}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="período" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="média" stroke="#0088FE" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível para exibir a evolução
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Tabela de Desempenho */}
            <Card>
              <CardHeader>
                <CardTitle>Desempenho Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Aluno</th>
                        <th className="text-center p-2">Média</th>
                        <th className="text-center p-2">Frequência</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((data) => (
                        <tr key={data.studentId} className="border-b">
                          <td className="p-2 font-medium">{data.studentName}</td>
                          <td className="p-2 text-center">
                            <Badge
                              className={
                                data.average >= 6.0
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }
                            >
                              {data.average.toFixed(1)}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={
                                data.attendancePercentage >= 75
                                  ? 'text-green-600 font-semibold'
                                  : 'text-red-600 font-semibold'
                              }
                            >
                              {data.attendancePercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {data.average >= 6.0 && data.attendancePercentage >= 75 ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Aprovado
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                Atenção
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

