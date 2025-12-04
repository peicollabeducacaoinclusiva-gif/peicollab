import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Calendar,
  Eye,
  MessageSquare,
  Users,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PEIWithEvaluation {
  id: string;
  student_name: string;
  teacher_name: string;
  status: string;
  created_at: string;
  last_review_date: string | null;
  reviews_count: number;
  evaluations_count: number;
  pending_evaluation: boolean;
}

interface EvaluationStats {
  total_peis: number;
  peis_with_reviews: number;
  peis_without_reviews: number;
  pending_evaluations: number;
  recent_reviews: number;
}

export default function PEIEvaluationsDashboard() {
  const [peis, setPeis] = useState<PEIWithEvaluation[]>([]);
  const [stats, setStats] = useState<EvaluationStats>({
    total_peis: 0,
    peis_with_reviews: 0,
    peis_without_reviews: 0,
    pending_evaluations: 0,
    recent_reviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'all' | 'pending' | 'recent'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

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

      // Buscar PEIs da escola (aprovados ou em validação)
      const { data: peisData, error: peisError } = await supabase
        .from('peis')
        .select(`
          id,
          status,
          created_at,
          student:students(name),
          teacher:profiles!peis_assigned_teacher_id_fkey(full_name)
        `)
        .eq('school_id', profile.school_id)
        .in('status', ['approved', 'pending_validation', 'validated'])
        .order('created_at', { ascending: false });

      if (peisError) throw peisError;

      // Para cada PEI, buscar reviews e evaluations
      const peisWithEvaluations = await Promise.all(
        (peisData || []).map(async (pei: any) => {
          // Buscar reviews
          const { data: reviews, count: reviewsCount } = await supabase
            .from('pei_reviews')
            .select('id, review_date', { count: 'exact' })
            .eq('pei_id', pei.id)
            .order('review_date', { ascending: false })
            .limit(1);

          // Buscar evaluations
          const { count: evaluationsCount } = await supabase
            .from('pei_evaluations')
            .select('id', { count: 'exact' })
            .eq('pei_id', pei.id);

          const lastReviewDate = reviews && reviews.length > 0 ? reviews[0].review_date : null;
          const daysSinceLastReview = lastReviewDate 
            ? Math.floor((Date.now() - new Date(lastReviewDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          return {
            id: pei.id,
            student_name: pei.student?.name || 'Aluno Desconhecido',
            teacher_name: pei.teacher?.full_name || 'Não atribuído',
            status: pei.status,
            created_at: pei.created_at,
            last_review_date: lastReviewDate,
            reviews_count: reviewsCount || 0,
            evaluations_count: evaluationsCount || 0,
            pending_evaluation: daysSinceLastReview > 30 || reviewsCount === 0,
          };
        })
      );

      setPeis(peisWithEvaluations);

      // Calcular estatísticas
      const totalPeis = peisWithEvaluations.length;
      const peisWithReviews = peisWithEvaluations.filter(p => p.reviews_count > 0).length;
      const peisWithoutReviews = totalPeis - peisWithReviews;
      const pendingEvaluations = peisWithEvaluations.filter(p => p.pending_evaluation).length;
      
      // Reviews dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentReviews = peisWithEvaluations.filter(p => 
        p.last_review_date && new Date(p.last_review_date) > sevenDaysAgo
      ).length;

      setStats({
        total_peis: totalPeis,
        peis_with_reviews: peisWithReviews,
        peis_without_reviews: peisWithoutReviews,
        pending_evaluations: pendingEvaluations,
        recent_reviews: recentReviews,
      });
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeis = peis.filter(pei => {
    if (selectedView === 'pending') return pei.pending_evaluation;
    if (selectedView === 'recent') {
      if (!pei.last_review_date) return false;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(pei.last_review_date) > sevenDaysAgo;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending_validation: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
      validated: { label: "Validado", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
      approved: { label: "Aprovado", color: "bg-green-500/10 text-green-700 border-green-200" },
    };
    const cfg = config[status] || config.pending_validation;
    return <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>;
  };

  const getDaysSinceLastReview = (lastReviewDate: string | null) => {
    if (!lastReviewDate) return '∞';
    const days = Math.floor((Date.now() - new Date(lastReviewDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Ações Rápidas no Topo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button 
          size="lg"
          onClick={() => navigate('/meetings/create')}
          className="h-auto py-4"
        >
          <Users className="h-5 w-5 mr-2" />
          <div className="text-left">
            <div className="font-bold">Agendar Reunião de Avaliação</div>
            <div className="text-xs font-normal opacity-90">Criar reunião para avaliar PEIs</div>
          </div>
        </Button>
        <Button 
          variant="outline"
          size="lg"
          onClick={() => navigate('/reports/evaluations')}
          className="h-auto py-4"
        >
          <TrendingUp className="h-5 w-5 mr-2" />
          <div className="text-left">
            <div className="font-bold">Ver Relatórios de Progresso</div>
            <div className="text-xs font-normal opacity-70">Análise e gráficos detalhados</div>
          </div>
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Total de PEIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.total_peis}</div>
            <p className="text-xs text-muted-foreground mt-1">Na escola</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pending_evaluations}</div>
            <p className="text-xs text-orange-700/70 mt-1">Sem avaliação há +30 dias</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Com Pareceres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.peis_with_reviews}</div>
            <p className="text-xs text-blue-700/70 mt-1">Já avaliados</p>
          </CardContent>
        </Card>

        <Card className="border-green-500 bg-gradient-to-br from-green-500/10 to-green-600/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.recent_reviews}</div>
            <p className="text-xs text-green-700/70 mt-1">Últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedView === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('pending')}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Pendentes ({stats.pending_evaluations})
        </Button>
        <Button
          variant={selectedView === 'recent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('recent')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Recentes ({stats.recent_reviews})
        </Button>
        <Button
          variant={selectedView === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('all')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Todos ({stats.total_peis})
        </Button>
      </div>

      {/* Lista de PEIs */}
      <Card>
        <CardHeader>
          <CardTitle>
            PEIs e Status de Avaliações
          </CardTitle>
          <CardDescription>
            Acompanhe os pareceres e avaliações registrados para cada PEI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredPeis.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum PEI encontrado nesta visualização</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {filteredPeis.map((pei) => (
                  <Card key={pei.id} className={`border-l-4 ${
                    pei.pending_evaluation 
                      ? 'border-l-orange-500 bg-orange-50/30' 
                      : 'border-l-blue-500'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">
                            {pei.student_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Professor: {pei.teacher_name}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(pei.status)}
                          {pei.pending_evaluation && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Precisa Avaliação
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pareceres</p>
                            <p className="font-bold">{pei.reviews_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Avaliações</p>
                            <p className="font-bold">{pei.evaluations_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Última Avaliação</p>
                            <p className="font-bold">
                              {pei.last_review_date 
                                ? `${getDaysSinceLastReview(pei.last_review_date)}d atrás`
                                : 'Nunca'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Criado em</p>
                            <p className="font-bold text-xs">
                              {format(new Date(pei.created_at), "dd/MM/yy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pei/view/${pei.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver PEI
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            // Abrir PEI na tab de avaliações
                            navigate(`/pei/view/${pei.id}?tab=avaliacoes`);
                          }}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Adicionar Parecer
                        </Button>
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
  );
}

