import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLayout } from "@/components/shared/PageLayout";
import { 
  TrendingUp, 
  Download,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProgressData {
  pei_id: string;
  student_name: string;
  progress_timeline: Array<{
    date: string;
    progress: string;
    reviewer: string;
  }>;
  total_reviews: number;
  avg_progress: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface GlobalStats {
  total_peis: number;
  total_reviews: number;
  total_evaluations: number;
  avg_reviews_per_pei: number;
  peis_excellent: number;
  peis_good: number;
  peis_average: number;
  peis_needs_improvement: number;
  peis_critical: number;
}

export default function EvaluationsReport() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90' | 'all'>('30');

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar school_id do coordenador
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Calcular data de corte baseada no período selecionado
      let dateFilter = new Date();
      if (selectedPeriod !== 'all') {
        const days = parseInt(selectedPeriod);
        dateFilter.setDate(dateFilter.getDate() - days);
      }

      // Buscar PEIs com suas avaliações
      type PEIWithStudent = {
        id: string;
        status: string;
        created_at: string;
        student: { name: string } | { name: string }[] | null;
      };

      const { data: peisData, error: peisError } = await supabase
        .from('peis')
        .select(`
          id,
          status,
          created_at,
          student:students(name)
        `)
        .eq('school_id', profile.school_id)
        .in('status', ['approved', 'validated'])
        .returns<PEIWithStudent[]>();

      if (peisError) throw peisError;

      // Para cada PEI, buscar reviews e calcular métricas
      const progressDataArray: ProgressData[] = [];
      let totalReviews = 0;
      let totalEvaluations = 0;
      let progressCounts = { excellent: 0, good: 0, average: 0, needs_improvement: 0, critical: 0 };

      for (const pei of (peisData || [])) {
        // Buscar reviews
        const { data: reviews } = await supabase
          .from('pei_reviews')
          .select(`
            review_date,
            evaluation_data,
            reviewer:profiles!pei_reviews_reviewer_id_fkey(full_name)
          `)
          .eq('pei_id', pei.id)
          .gte('review_date', selectedPeriod === 'all' ? '2000-01-01' : dateFilter.toISOString())
          .order('review_date', { ascending: true });

        // Buscar evaluations
        const { count: evalCount } = await supabase
          .from('pei_evaluations')
          .select('id', { count: 'exact' })
          .eq('pei_id', pei.id);

        const reviewsCount = reviews?.length || 0;
        totalReviews += reviewsCount;
        totalEvaluations += evalCount || 0;

        if (reviews && reviews.length > 0) {
          // Montar timeline
          const timeline = reviews.map((r) => {
            const reviewerRecord = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
            return {
              date: r.review_date,
              progress: r.evaluation_data?.overall_progress || 'good',
              reviewer: reviewerRecord?.full_name || 'Desconhecido',
            };
          });

          // Calcular média de progresso
          const progressValues: Record<string, number> = {
            excellent: 5,
            good: 4,
            average: 3,
            needs_improvement: 2,
            critical: 1,
          };

          const avgProgress = timeline.reduce((sum, t) => 
            sum + (progressValues[t.progress] || 3), 0
          ) / timeline.length;

          // Determinar tendência
          let trend: 'improving' | 'stable' | 'declining' = 'stable';
          if (timeline.length >= 2) {
            const firstProgress = progressValues[timeline[0].progress] || 3;
            const lastProgress = progressValues[timeline[timeline.length - 1].progress] || 3;
            if (lastProgress > firstProgress) trend = 'improving';
            else if (lastProgress < firstProgress) trend = 'declining';
          }

          // Contar último progresso
          const lastProgress = timeline[timeline.length - 1]?.progress;
          if (lastProgress && progressCounts.hasOwnProperty(lastProgress)) {
            progressCounts[lastProgress as keyof typeof progressCounts]++;
          }

          progressDataArray.push({
            pei_id: pei.id,
            student_name: (Array.isArray(pei.student) ? pei.student[0]?.name : pei.student?.name) || 'Aluno Desconhecido',
            progress_timeline: timeline,
            total_reviews: reviewsCount,
            avg_progress: avgProgress,
            trend,
          });
        }
      }

      setProgressData(progressDataArray);

      // Calcular estatísticas globais
      const totalPeis = peisData?.length || 0;
      setGlobalStats({
        total_peis: totalPeis,
        total_reviews: totalReviews,
        total_evaluations: totalEvaluations,
        avg_reviews_per_pei: totalPeis > 0 ? totalReviews / totalPeis : 0,
        peis_excellent: progressCounts.excellent,
        peis_good: progressCounts.good,
        peis_average: progressCounts.average,
        peis_needs_improvement: progressCounts.needs_improvement,
        peis_critical: progressCounts.critical,
      });
    } catch (error: any) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getTrendBadge = (trend: string) => {
    const config: Record<string, { label: string; color: string }> = {
      improving: { label: "Em Melhoria", color: "bg-green-500/10 text-green-700 border-green-200" },
      stable: { label: "Estável", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
      declining: { label: "Em Declínio", color: "bg-red-500/10 text-red-700 border-red-200" },
    };
    const cfg = config[trend] || config.stable;
    return <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>;
  };

  const getProgressLabel = (progress: string) => {
    const labels: Record<string, string> = {
      excellent: "⭐ Excelente",
      good: "👍 Bom",
      average: "😐 Regular",
      needs_improvement: "⚠️ Precisa Melhorar",
      critical: "🚨 Crítico",
    };
    return labels[progress] || progress;
  };

  return (
    <PageLayout title="Relatórios de Avaliações" backUrl="/dashboard">
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Avaliações</h1>
            <p className="text-muted-foreground">
              Análise de progresso e pareceres dos PEIs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estatísticas Globais */}
        {globalStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de PEIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{globalStats.total_peis}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Pareceres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{globalStats.total_reviews}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média: {globalStats.avg_reviews_per_pei.toFixed(1)} por PEI
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avaliações Cíclicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{globalStats.total_evaluations}</div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Excelente/Bom</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {globalStats.peis_excellent + globalStats.peis_good}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {globalStats.total_peis > 0 
                    ? `${((globalStats.peis_excellent + globalStats.peis_good) / globalStats.total_peis * 100).toFixed(0)}%`
                    : '0%'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Atenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {globalStats.peis_needs_improvement + globalStats.peis_critical}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Precisam melhorar
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico de Distribuição de Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Progresso Atual
            </CardTitle>
            <CardDescription>
              Classificação dos PEIs baseada nas últimas avaliações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {globalStats && (
              <div className="space-y-3">
                {/* Barra Excelente */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">⭐ Excelente</span>
                    <span className="text-sm font-bold text-green-600">{globalStats.peis_excellent}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: globalStats.total_peis > 0 
                          ? `${(globalStats.peis_excellent / globalStats.total_peis) * 100}%`
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                {/* Barra Bom */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">👍 Bom</span>
                    <span className="text-sm font-bold text-blue-600">{globalStats.peis_good}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: globalStats.total_peis > 0 
                          ? `${(globalStats.peis_good / globalStats.total_peis) * 100}%`
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                {/* Barra Regular */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">😐 Regular</span>
                    <span className="text-sm font-bold text-yellow-600">{globalStats.peis_average}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-yellow-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: globalStats.total_peis > 0 
                          ? `${(globalStats.peis_average / globalStats.total_peis) * 100}%`
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                {/* Barra Precisa Melhorar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">⚠️ Precisa Melhorar</span>
                    <span className="text-sm font-bold text-orange-600">{globalStats.peis_needs_improvement}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-orange-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: globalStats.total_peis > 0 
                          ? `${(globalStats.peis_needs_improvement / globalStats.total_peis) * 100}%`
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                {/* Barra Crítico */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">🚨 Crítico</span>
                    <span className="text-sm font-bold text-red-600">{globalStats.peis_critical}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: globalStats.total_peis > 0 
                          ? `${(globalStats.peis_critical / globalStats.total_peis) * 100}%`
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progresso Individual dos PEIs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Individual dos PEIs
            </CardTitle>
            <CardDescription>
              Histórico de avaliações e tendências de progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : progressData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum dado de avaliação encontrado no período selecionado</p>
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {progressData.map((data) => (
                    <Card key={data.pei_id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{data.student_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {data.total_reviews} {data.total_reviews === 1 ? 'parecer' : 'pareceres'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getTrendBadge(data.trend)}
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-muted-foreground">Média:</span>
                              <span className="font-bold">{data.avg_progress.toFixed(1)}/5</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Timeline de Avaliações */}
                        <div className="space-y-2">
                          {data.progress_timeline.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground w-20">
                                {format(new Date(entry.date), "dd/MM/yy", { locale: ptBR })}
                              </span>
                              <div className="flex items-center gap-2 flex-1">
                                {getTrendIcon(
                                  idx > 0 
                                    ? (entry.progress > data.progress_timeline[idx - 1].progress ? 'improving' : 
                                       entry.progress < data.progress_timeline[idx - 1].progress ? 'declining' : 'stable')
                                    : 'stable'
                                )}
                                <span className="text-xs font-medium">
                                  {getProgressLabel(entry.progress)}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {entry.reviewer}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

