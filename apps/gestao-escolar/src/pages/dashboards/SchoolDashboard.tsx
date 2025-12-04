import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Button } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { MetricCard, UniversalBarChart, UniversalLineChart, UniversalPieChart } from '@/components/dashboards';
import { EmptyState } from '@/components/EmptyState';
import { PageLoading } from '@/components/PageLoading';
import { useSchoolAttendanceMetrics, useStudentsAtRisk, useClassEvolution, useInclusionMetrics } from '@/hooks/useDashboards';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  RefreshCw,
  Download,
  FileText
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui';
import { Badge } from '@/components/ui';

export default function SchoolDashboard() {
  const { data: profile } = useUserProfile();
  const schoolId = profile?.school_id || null;
  const tenantId = profile?.tenant_id || null;

  const [periodDays, setPeriodDays] = useState<number>(30);
  const periodStart = format(subDays(new Date(), periodDays), 'yyyy-MM-dd');
  const periodEnd = format(new Date(), 'yyyy-MM-dd');

  // Buscar dados
  const { data: attendance, isLoading: attendanceLoading } = useSchoolAttendanceMetrics(
    schoolId || null,
    periodStart,
    periodEnd
  );

  const { data: studentsAtRisk, isLoading: riskLoading } = useStudentsAtRisk({
    schoolId: schoolId || undefined,
    tenantId: tenantId || undefined,
  });

  const { data: classEvolution, isLoading: evolutionLoading } = useClassEvolution(
    schoolId || null,
    format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    periodEnd
  );

  const { data: inclusion, isLoading: inclusionLoading } = useInclusionMetrics({
    schoolId: schoolId || undefined,
    tenantId: tenantId || undefined,
  });

  const isLoading = attendanceLoading || riskLoading || evolutionLoading || inclusionLoading;

  // Preparar dados para gráficos
  const attendanceTrendData = attendance?.attendance_trend?.map((item) => ({
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
    frequencia: Number(item.rate) || 0,
  })) || [];

  const classAttendanceData = attendance?.class_attendance?.map((item) => ({
    name: item.class_name,
    value: Number(item.avg_attendance_rate) || 0,
  })) || [];

  const riskDistribution = studentsAtRisk?.reduce((acc, student) => {
    acc[student.risk_level] = (acc[student.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const riskData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level === 'critical' ? 'Crítico' : level === 'high' ? 'Alto' : level === 'medium' ? 'Médio' : 'Baixo',
    value: count,
  }));

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Painel da Escola"
        description={`Dashboard completo com indicadores de frequência, evolução e inclusão`}
        actions={
          <>
            <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Cards de Métricas Principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total de Alunos"
                value={attendance?.total_students || 0}
                icon={Users}
                description="Alunos ativos na escola"
              />
              <MetricCard
                title="Taxa de Frequência"
                value={`${attendance?.average_attendance_rate?.toFixed(1) || 0}%`}
                icon={Calendar}
                description="Média geral de frequência"
                trend={{
                  value: 2.5,
                  label: 'vs período anterior',
                  isPositive: true,
                }}
              />
              <MetricCard
                title="Alunos com Risco"
                value={studentsAtRisk?.length || 0}
                icon={AlertTriangle}
                description="Requerem atenção"
                className={studentsAtRisk && studentsAtRisk.length > 0 ? 'border-orange-200' : ''}
              />
              <MetricCard
                title="Taxa de Inclusão"
                value={`${inclusion?.pei_coverage_rate?.toFixed(1) || 0}%`}
                icon={GraduationCap}
                description="Cobertura de PEIs"
              />
            </div>

            {/* Tabs com Diferentes Visualizações */}
            <Tabs defaultValue="attendance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="attendance">Frequência</TabsTrigger>
                <TabsTrigger value="risks">Alunos com Risco</TabsTrigger>
                <TabsTrigger value="evolution">Evolução das Turmas</TabsTrigger>
                <TabsTrigger value="inclusion">Inclusão e AEE</TabsTrigger>
              </TabsList>

              {/* Frequência */}
              <TabsContent value="attendance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <UniversalLineChart
                    data={attendanceTrendData}
                    dataKey="date"
                    series={[
                      { key: 'frequencia', label: 'Taxa de Frequência (%)', color: 'hsl(var(--chart-1))' },
                    ]}
                    title="Evolução da Frequência"
                    description={`Período: ${format(new Date(periodStart), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(periodEnd), 'dd/MM/yyyy', { locale: ptBR })}`}
                  />
                  <UniversalBarChart
                    data={classAttendanceData}
                    dataKey="name"
                    valueKey="value"
                    title="Frequência por Turma"
                    description="Taxa média de frequência"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Alunos com Baixa Frequência</CardTitle>
                    <CardDescription>
                      Alunos com frequência abaixo de 75% ({attendance?.students_low_attendance || 0} alunos)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attendance?.students_low_attendance === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum aluno com baixa frequência no período
                      </p>
                    ) : (
                      <div className="text-2xl font-bold text-center py-4">
                        {attendance?.students_low_attendance || 0} alunos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alunos com Risco */}
              <TabsContent value="risks" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <UniversalPieChart
                    data={riskData}
                    title="Distribuição de Riscos"
                    description="Classificação por nível de risco"
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Alertas Automáticos</CardTitle>
                      <CardDescription>Alertas gerados automaticamente pelos indicadores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {studentsAtRisk && studentsAtRisk.filter(s => s.risk_level === 'critical').length > 0 && (
                          <div className="flex items-center gap-2 p-3 border border-red-200 bg-red-50 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-semibold text-red-900">
                                {studentsAtRisk.filter(s => s.risk_level === 'critical').length} aluno(s) com risco crítico
                              </p>
                              <p className="text-sm text-red-700">
                                Requer atenção imediata
                              </p>
                            </div>
                          </div>
                        )}
                        {studentsAtRisk && studentsAtRisk.filter(s => s.risk_level === 'high').length > 0 && (
                          <div className="flex items-center gap-2 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="font-semibold text-orange-900">
                                {studentsAtRisk.filter(s => s.risk_level === 'high').length} aluno(s) com risco alto
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Alunos com Risco */}
                <Card>
                  <CardHeader>
                    <CardTitle>Alunos com Risco de Aprendizagem</CardTitle>
                    <CardDescription>
                      {studentsAtRisk?.length || 0} aluno(s) identificado(s) com indicadores de risco
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!studentsAtRisk || studentsAtRisk.length === 0 ? (
                      <EmptyState
                        icon={TrendingUp}
                        title="Nenhum aluno com risco identificado"
                        description="Todos os alunos estão dentro dos parâmetros esperados."
                      />
                    ) : (
                      <div className="space-y-2">
                        {studentsAtRisk.map((student) => (
                          <div
                            key={student.student_id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{student.student_name}</p>
                                <Badge
                                  variant={
                                    student.risk_level === 'critical'
                                      ? 'destructive'
                                      : student.risk_level === 'high'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {student.risk_level === 'critical'
                                    ? 'Crítico'
                                    : student.risk_level === 'high'
                                    ? 'Alto'
                                    : student.risk_level === 'medium'
                                    ? 'Médio'
                                    : 'Baixo'}
                                </Badge>
                                <Badge variant="outline">
                                  {student.risk_type === 'attendance'
                                    ? 'Frequência'
                                    : student.risk_type === 'grades'
                                    ? 'Notas'
                                    : 'Inclusão'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {student.class_name || 'Sem turma'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Evolução das Turmas */}
              <TabsContent value="evolution" className="space-y-4">
                {!classEvolution || classEvolution.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="Nenhuma turma encontrada"
                    description="Não há dados de evolução disponíveis para as turmas."
                  />
                ) : (
                  <div className="grid gap-4">
                    {classEvolution.map((classData) => (
                      <Card key={classData.class_id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{classData.class_name}</CardTitle>
                              <CardDescription>
                                {classData.total_students} aluno(s)
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                classData.performance_trend === 'melhorando'
                                  ? 'default'
                                  : classData.performance_trend === 'piorando'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {classData.performance_trend === 'melhorando'
                                ? 'Melhorando'
                                : classData.performance_trend === 'piorando'
                                ? 'Piorando'
                                : 'Estável'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <UniversalLineChart
                            data={classData.attendance_evolution?.map((item) => ({
                              month: format(new Date(item.month), 'MMM', { locale: ptBR }),
                              frequencia: Number(item.rate) || 0,
                            })) || []}
                            dataKey="month"
                            series={[
                              { key: 'frequencia', label: 'Frequência (%)', color: 'hsl(var(--chart-1))' },
                            ]}
                            height={200}
                            className="border-0 shadow-none"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Inclusão e AEE */}
              <TabsContent value="inclusion" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    title="Alunos com Necessidades"
                    value={inclusion?.total_students_with_needs || 0}
                    icon={Users}
                  />
                  <MetricCard
                    title="Cobertura de PEI"
                    value={`${inclusion?.pei_coverage_rate?.toFixed(1) || 0}%`}
                    icon={FileText}
                    description={`${inclusion?.students_with_pei || 0} alunos com PEI`}
                  />
                  <MetricCard
                    title="Cobertura de AEE"
                    value={`${inclusion?.aee_coverage_rate?.toFixed(1) || 0}%`}
                    icon={GraduationCap}
                    description={`${inclusion?.students_with_aee || 0} alunos com AEE`}
                  />
                </div>

                {inclusion?.needs_distribution && inclusion.needs_distribution.length > 0 && (
                  <UniversalPieChart
                    data={inclusion.needs_distribution.map((item) => ({
                      name: item.need,
                      value: item.count,
                    }))}
                    title="Distribuição de Necessidades"
                    description="Tipos de necessidades especiais dos alunos"
                  />
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Efetividade do AEE</CardTitle>
                    <CardDescription>
                      Indicador de progresso dos alunos em atendimento AEE
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Taxa de Efetividade</span>
                          <span className="text-2xl font-bold">
                            {inclusion?.aee_effectiveness?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${inclusion?.aee_effectiveness || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
