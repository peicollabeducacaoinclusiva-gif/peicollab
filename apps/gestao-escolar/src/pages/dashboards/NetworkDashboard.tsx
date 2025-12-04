import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Button } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { MetricCard, UniversalBarChart, UniversalLineChart } from '@/components/dashboards';
import { EmptyState } from '@/components/EmptyState';
import { PageLoading } from '@/components/PageLoading';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { 
  School, 
  Users, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  GraduationCap,
  RefreshCw,
  Download,
  ArrowRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';

interface NetworkKPIs {
  total_schools: number;
  total_students: number;
  students_with_pei: number;
  total_peis: number;
  peis_approved: number;
  peis_pending: number;
  peis_returned: number;
  peis_draft: number;
  avg_completion_time: number;
  family_engagement_rate: number;
  inclusion_rate: number;
  compliance_rate: number;
}

interface SchoolPerformance {
  school_id: string;
  school_name: string;
  director: string;
  total_students: number;
  students_with_pei: number;
  total_peis: number;
  approved_peis: number;
  pending_peis: number;
  returned_peis: number;
  average_time_to_approval: number;
  family_engagement: number;
  last_activity: string;
}

export default function NetworkDashboard() {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const tenantId = profile?.tenant_id;

  const [periodDays, setPeriodDays] = useState<number>(30);
  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  // Buscar KPIs da Rede
  const { data: networkKPIs, isLoading: kpisLoading } = useQuery<NetworkKPIs>({
    queryKey: ['dashboard', 'network-kpis', tenantId, periodStart],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_network_kpis', {
        p_tenant_id: tenantId,
        p_period_start: periodStart,
      });
      if (error) throw error;
      return data as NetworkKPIs;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

  // Buscar Performance por Escola
  const { data: schoolPerformance, isLoading: performanceLoading } = useQuery<SchoolPerformance[]>({
    queryKey: ['dashboard', 'school-performance', tenantId, periodStart],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_school_performance', {
        p_tenant_id: tenantId,
        p_period_start: periodStart,
      });
      if (error) throw error;
      return (data || []) as SchoolPerformance[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

  // Buscar Indicadores de Inclusão
  const { data: inclusionMetrics } = useQuery({
    queryKey: ['dashboard', 'network-inclusion', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_inclusion_metrics', {
        p_tenant_id: tenantId,
        p_school_id: null,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = kpisLoading || performanceLoading;

  // Preparar dados para gráficos
  const schoolComparisonData = schoolPerformance?.map((school) => ({
    escola: school.school_name.length > 15 ? school.school_name.slice(0, 15) + '...' : school.school_name,
    taxa_inclusao: school.total_students > 0 
      ? Number(((school.students_with_pei / school.total_students) * 100).toFixed(1))
      : 0,
    engajamento: Number(school.family_engagement.toFixed(1)),
  })) || [];

  const peiStatusData = networkKPIs ? [
    { name: 'Aprovados', value: Number(networkKPIs.peis_approved) },
    { name: 'Pendentes', value: Number(networkKPIs.peis_pending) },
    { name: 'Retornados', value: Number(networkKPIs.peis_returned) },
    { name: 'Rascunho', value: Number(networkKPIs.peis_draft) },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Painel da Rede"
        description="Visão comparativa de todas as escolas da rede"
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            {/* Cards de KPIs Principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total de Escolas"
                value={networkKPIs?.total_schools || 0}
                icon={School}
                description="Escolas ativas na rede"
              />
              <MetricCard
                title="Total de Alunos"
                value={networkKPIs?.total_students || 0}
                icon={Users}
                description="Alunos matriculados"
              />
              <MetricCard
                title="Taxa de Inclusão"
                value={`${networkKPIs?.inclusion_rate?.toFixed(1) || 0}%`}
                icon={GraduationCap}
                description="Alunos com PEI"
                trend={{
                  value: 5.2,
                  label: 'vs período anterior',
                  isPositive: true,
                }}
              />
              <MetricCard
                title="Engajamento Familiar"
                value={`${networkKPIs?.family_engagement_rate?.toFixed(1) || 0}%`}
                icon={Award}
                description="Famílias participativas"
              />
            </div>

            {/* Cards Secundários */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="PEIs Aprovados"
                value={networkKPIs?.peis_approved || 0}
                icon={TrendingUp}
                description={`de ${networkKPIs?.total_peis || 0} total`}
              />
              <MetricCard
                title="PEIs Pendentes"
                value={networkKPIs?.peis_pending || 0}
                icon={AlertTriangle}
                description="Aguardando validação"
                className={networkKPIs && networkKPIs.peis_pending > 0 ? 'border-yellow-200' : ''}
              />
              <MetricCard
                title="Tempo Médio"
                value={`${networkKPIs?.avg_completion_time?.toFixed(1) || 0} dias`}
                icon={RefreshCw}
                description="Para aprovação de PEI"
              />
              <MetricCard
                title="Taxa de Conformidade"
                value={`${networkKPIs?.compliance_rate?.toFixed(1) || 0}%`}
                icon={Award}
                description="PEIs em conformidade"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="comparison" className="space-y-4">
              <TabsList>
                <TabsTrigger value="comparison">Comparativo</TabsTrigger>
                <TabsTrigger value="inclusion">Inclusão</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Comparativo entre Escolas */}
              <TabsContent value="comparison" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <UniversalBarChart
                    data={schoolComparisonData}
                    dataKey="escola"
                    valueKey="taxa_inclusao"
                    title="Taxa de Inclusão por Escola"
                    description="Percentual de alunos com PEI por escola"
                  />
                  <UniversalBarChart
                    data={schoolComparisonData}
                    dataKey="escola"
                    valueKey="engajamento"
                    title="Engajamento Familiar por Escola"
                    description="Percentual de engajamento familiar"
                  />
                </div>

                {/* Tabela Comparativa */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Detalhada por Escola</CardTitle>
                    <CardDescription>
                      Comparativo de todas as escolas da rede
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!schoolPerformance || schoolPerformance.length === 0 ? (
                      <EmptyState
                        icon={School}
                        title="Nenhuma escola encontrada"
                        description="Não há dados de performance disponíveis."
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Escola</TableHead>
                              <TableHead>Diretor</TableHead>
                              <TableHead>Alunos</TableHead>
                              <TableHead>PEIs</TableHead>
                              <TableHead>Taxa Inclusão</TableHead>
                              <TableHead>Engajamento</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {schoolPerformance.map((school) => (
                              <TableRow key={school.school_id}>
                                <TableCell className="font-medium">{school.school_name}</TableCell>
                                <TableCell>{school.director}</TableCell>
                                <TableCell>{school.total_students}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span>{school.total_peis}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {school.approved_peis} aprovados
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {school.total_students > 0
                                    ? `${((school.students_with_pei / school.total_students) * 100).toFixed(1)}%`
                                    : '0%'}
                                </TableCell>
                                <TableCell>{school.family_engagement.toFixed(1)}%</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/dashboards/school?schoolId=${school.school_id}`)}
                                  >
                                    Ver Detalhes
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Indicadores de Inclusão */}
              <TabsContent value="inclusion" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    title="Alunos com Necessidades"
                    value={inclusionMetrics?.total_students_with_needs || 0}
                    icon={Users}
                  />
                  <MetricCard
                    title="Cobertura de PEI"
                    value={`${inclusionMetrics?.pei_coverage_rate?.toFixed(1) || 0}%`}
                    icon={GraduationCap}
                    description={`${inclusionMetrics?.students_with_pei || 0} alunos com PEI`}
                  />
                  <MetricCard
                    title="Cobertura de AEE"
                    value={`${inclusionMetrics?.aee_coverage_rate?.toFixed(1) || 0}%`}
                    icon={Award}
                    description={`${inclusionMetrics?.students_with_aee || 0} alunos com AEE`}
                  />
                </div>

                {inclusionMetrics?.needs_distribution && inclusionMetrics.needs_distribution.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição de Necessidades</CardTitle>
                      <CardDescription>Tipos de necessidades especiais na rede</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {inclusionMetrics.needs_distribution.map((item: any) => (
                          <div key={item.need} className="p-4 border rounded-lg">
                            <p className="font-semibold">{item.need}</p>
                            <p className="text-2xl font-bold mt-2">{item.count}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Performance e Efetividade */}
              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tempo Médio de Aprovação</CardTitle>
                      <CardDescription>
                        Tempo médio para aprovação de PEIs por escola
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        {networkKPIs?.avg_completion_time?.toFixed(1) || 0} dias
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Média da rede
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Conformidade</CardTitle>
                      <CardDescription>
                        Percentual de PEIs aprovados sem necessidade de retorno
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        {networkKPIs?.compliance_rate?.toFixed(1) || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {networkKPIs?.peis_approved || 0} de {networkKPIs?.total_peis || 0} PEIs
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {schoolPerformance && schoolPerformance.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ranking de Performance</CardTitle>
                      <CardDescription>
                        Escolas ordenadas por taxa de inclusão e engajamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[...schoolPerformance]
                          .sort((a, b) => {
                            const rateA = a.total_students > 0 ? (a.students_with_pei / a.total_students) * 100 : 0;
                            const rateB = b.total_students > 0 ? (b.students_with_pei / b.total_students) * 100 : 0;
                            return rateB - rateA;
                          })
                          .slice(0, 5)
                          .map((school, index) => (
                            <div
                              key={school.school_id}
                              className="flex items-center gap-4 p-4 border rounded-lg"
                            >
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{school.school_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {school.total_students} alunos • {school.total_peis} PEIs
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  {school.total_students > 0
                                    ? `${((school.students_with_pei / school.total_students) * 100).toFixed(1)}%`
                                    : '0%'}
                                </p>
                                <p className="text-xs text-muted-foreground">Taxa de Inclusão</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
