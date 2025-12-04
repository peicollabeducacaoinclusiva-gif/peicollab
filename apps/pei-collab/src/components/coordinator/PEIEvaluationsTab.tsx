import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PEIReview {
  id: string;
  review_date: string;
  notes: string;
  reviewer_role: string;
  next_review_date: string | null;
  evaluation_data: any;
  meeting_id: string | null;
  reviewer: {
    full_name: string;
  } | null;
  meeting: {
    title: string;
    meeting_type: string;
    meeting_date: string;
  } | null;
}

interface PEIEvaluation {
  id: string;
  cycle_number: number;
  cycle_name: string;
  academic_year: string;
  status: string;
  evaluation_data: any;
  goals_achieved: any[];
  goals_partially_achieved: any[];
  goals_not_achieved: any[];
  academic_progress: string | null;
  social_progress: string | null;
  behavioral_progress: string | null;
  autonomy_progress: string | null;
  teacher_recommendations: string | null;
  coordinator_recommendations: string | null;
  evaluated_at: string | null;
  reviewed_at: string | null;
  completion_date: string | null;
  meeting_id: string | null;
  evaluator: {
    full_name: string;
  } | null;
  meeting: {
    title: string;
    meeting_date: string;
  } | null;
}

interface PEIEvaluationsTabProps {
  peiId: string;
  currentUserId: string;
  onUpdate?: () => void;
}

export default function PEIEvaluationsTab({ peiId, currentUserId, onUpdate }: PEIEvaluationsTabProps) {
  const [reviews, setReviews] = useState<PEIReview[]>([]);
  const [evaluations, setEvaluations] = useState<PEIEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingReview, setAddingReview] = useState(false);
  const [newReviewNotes, setNewReviewNotes] = useState("");
  const [overallProgress, setOverallProgress] = useState<string>("good");
  const { toast } = useToast();

  useEffect(() => {
    if (peiId) {
      loadEvaluations();
    }
  }, [peiId]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);

      // Buscar pareceres (pei_reviews)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("pei_reviews")
        .select(`
          id,
          review_date,
          notes,
          reviewer_role,
          next_review_date,
          evaluation_data,
          meeting_id,
          reviewer:profiles!pei_reviews_reviewer_id_fkey(full_name),
          meeting:pei_meetings(title, meeting_type, meeting_date)
        `)
        .eq("pei_id", peiId)
        .order("review_date", { ascending: false });

      if (reviewsError) {
        console.error("Erro ao carregar pareceres:", reviewsError);
        throw reviewsError;
      }

      // Buscar avaliações cíclicas (pei_evaluations)
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from("pei_evaluations")
        .select(`
          id,
          cycle_number,
          cycle_name,
          academic_year,
          status,
          evaluation_data,
          goals_achieved,
          goals_partially_achieved,
          goals_not_achieved,
          academic_progress,
          social_progress,
          behavioral_progress,
          autonomy_progress,
          teacher_recommendations,
          coordinator_recommendations,
          evaluated_at,
          reviewed_at,
          completion_date,
          meeting_id,
          evaluator:profiles!pei_evaluations_evaluated_by_fkey(full_name),
          meeting:pei_meetings(title, meeting_date)
        `)
        .eq("pei_id", peiId)
        .order("cycle_number", { ascending: true });

      if (evaluationsError) {
        console.error("Erro ao carregar avaliações:", evaluationsError);
        throw evaluationsError;
      }

      const normalizedReviews = (reviewsData || []).map((review) => ({
        ...review,
        reviewer: Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer,
        meeting: Array.isArray(review.meeting) ? review.meeting[0] : review.meeting,
      }));

      const normalizedEvaluations = (evaluationsData || []).map((evaluation) => ({
        ...evaluation,
        evaluator: Array.isArray(evaluation.evaluator) ? evaluation.evaluator[0] : evaluation.evaluator,
        meeting: Array.isArray(evaluation.meeting) ? evaluation.meeting[0] : evaluation.meeting,
      }));

      setReviews(normalizedReviews as PEIReview[]);
      setEvaluations(normalizedEvaluations as PEIEvaluation[]);
    } catch (error: any) {
      console.error("Erro ao carregar avaliações:", error);
      toast({
        title: "Erro ao carregar avaliações",
        description: error.message || "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!newReviewNotes.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, adicione suas observações no parecer",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingReview(true);

      // Buscar role do usuário
      const { data: userRoleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId)
        .single();

      if (roleError) throw roleError;

      const { error } = await supabase
        .from("pei_reviews")
        .insert({
          pei_id: peiId,
          reviewer_id: currentUserId,
          reviewer_role: userRoleData.role,
          notes: newReviewNotes.trim(),
          review_date: new Date().toISOString(),
          evaluation_data: {
            overall_progress: overallProgress,
          },
        });

      if (error) throw error;

      toast({
        title: "Parecer adicionado!",
        description: "O parecer foi registrado com sucesso.",
      });

      setNewReviewNotes("");
      setOverallProgress("good");
      await loadEvaluations();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Erro ao adicionar parecer:", error);
      toast({
        title: "Erro ao adicionar parecer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingReview(false);
    }
  };

  const getProgressBadge = (progress: string | null) => {
    if (!progress) return null;
    
    const config: Record<string, { label: string; color: string }> = {
      excellent: { label: "Excelente", color: "bg-green-500" },
      good: { label: "Bom", color: "bg-blue-500" },
      average: { label: "Regular", color: "bg-yellow-500" },
      needs_improvement: { label: "Precisa Melhorar", color: "bg-orange-500" },
      critical: { label: "Crítico", color: "bg-red-500" },
    };

    const cfg = config[progress] || config.good;
    return <Badge className={`${cfg.color} text-white`}>{cfg.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: "Pendente", color: "bg-gray-500/10 text-gray-700 border-gray-200", icon: Clock },
      in_progress: { label: "Em Andamento", color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: TrendingUp },
      completed: { label: "Concluída", color: "bg-green-500/10 text-green-700 border-green-200", icon: CheckCircle },
      reviewed: { label: "Revisada", color: "bg-purple-500/10 text-purple-700 border-purple-200", icon: CheckCircle },
    };

    const cfg = config[status] || config.pending;
    const Icon = cfg.icon;

    return (
      <Badge variant="outline" className={`${cfg.color} font-medium flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão Adicionar Parecer */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Parecer Rápido
          </CardTitle>
          <CardDescription>
            Registre uma observação ou avaliação pontual deste PEI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Progresso Geral</label>
            <Select value={overallProgress} onValueChange={setOverallProgress}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">⭐ Excelente</SelectItem>
                <SelectItem value="good">👍 Bom</SelectItem>
                <SelectItem value="average">😐 Regular</SelectItem>
                <SelectItem value="needs_improvement">⚠️ Precisa Melhorar</SelectItem>
                <SelectItem value="critical">🚨 Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Adicione suas observações, recomendações ou decisões tomadas..."
            value={newReviewNotes}
            onChange={(e) => setNewReviewNotes(e.target.value)}
            rows={4}
          />
          <Button 
            onClick={handleAddReview} 
            disabled={addingReview || !newReviewNotes.trim()}
            className="w-full"
          >
            {addingReview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Parecer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de Pareceres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Pareceres ({reviews.length})
          </CardTitle>
          <CardDescription>
            Pareceres e observações registrados em reuniões ou avaliações pontuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum parecer registrado ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                              {review.reviewer?.full_name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {review.reviewer?.full_name || "Revisor"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(review.review_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        {review.evaluation_data?.overall_progress && 
                          getProgressBadge(review.evaluation_data.overall_progress)
                        }
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {review.meeting_id && review.meeting && (
                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Reunião:</span>
                          <span className="text-muted-foreground">{review.meeting.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {review.meeting.meeting_type}
                          </Badge>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">
                        {review.notes}
                      </div>
                      {review.next_review_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                          <Calendar className="h-4 w-4" />
                          <span>Próxima revisão:</span>
                          <span className="font-medium">
                            {format(new Date(review.next_review_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Avaliações Cíclicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Avaliações Cíclicas
          </CardTitle>
          <CardDescription>
            Avaliações formais por ciclo (I, II, III) conforme calendário escolar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma avaliação cíclica registrada ainda</p>
              <p className="text-xs mt-2">As avaliações cíclicas serão criadas automaticamente nos períodos definidos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <Card key={evaluation.id} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">{evaluation.cycle_name}</h4>
                          {getStatusBadge(evaluation.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ano Letivo: {evaluation.academic_year}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg font-bold">
                        Ciclo {evaluation.cycle_number}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evaluation.meeting_id && evaluation.meeting && (
                      <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/20 p-2 rounded-md">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Reunião:</span>
                        <span className="text-muted-foreground">{evaluation.meeting.title}</span>
                      </div>
                    )}

                    {/* Progresso por Dimensão */}
                    {(evaluation.academic_progress || evaluation.social_progress || 
                      evaluation.behavioral_progress || evaluation.autonomy_progress) && (
                      <div className="grid grid-cols-2 gap-3">
                        {evaluation.academic_progress && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Progresso Acadêmico</p>
                            <div className="text-sm">{evaluation.academic_progress}</div>
                          </div>
                        )}
                        {evaluation.social_progress && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Progresso Social</p>
                            <div className="text-sm">{evaluation.social_progress}</div>
                          </div>
                        )}
                        {evaluation.behavioral_progress && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Comportamento</p>
                            <div className="text-sm">{evaluation.behavioral_progress}</div>
                          </div>
                        )}
                        {evaluation.autonomy_progress && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Autonomia</p>
                            <div className="text-sm">{evaluation.autonomy_progress}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metas */}
                    {(evaluation.goals_achieved.length > 0 || 
                      evaluation.goals_partially_achieved.length > 0 || 
                      evaluation.goals_not_achieved.length > 0) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Status das Metas:</p>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                              <div className="font-bold text-green-700 dark:text-green-400">
                                {evaluation.goals_achieved.length}
                              </div>
                              <div className="text-muted-foreground">Alcançadas</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                              <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                              <div className="font-bold text-yellow-700 dark:text-yellow-400">
                                {evaluation.goals_partially_achieved.length}
                              </div>
                              <div className="text-muted-foreground">Parciais</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                              <AlertCircle className="h-4 w-4 text-red-600 mx-auto mb-1" />
                              <div className="font-bold text-red-700 dark:text-red-400">
                                {evaluation.goals_not_achieved.length}
                              </div>
                              <div className="text-muted-foreground">Não Alcançadas</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Recomendações */}
                    {(evaluation.teacher_recommendations || evaluation.coordinator_recommendations) && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          {evaluation.teacher_recommendations && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Recomendações do Professor:</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {evaluation.teacher_recommendations}
                              </p>
                            </div>
                          )}
                          {evaluation.coordinator_recommendations && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Recomendações do Coordenador:</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {evaluation.coordinator_recommendations}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Datas */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      {evaluation.evaluated_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Avaliado:</span>
                          <span>{format(new Date(evaluation.evaluated_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      )}
                      {evaluation.reviewed_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Revisado:</span>
                          <span>{format(new Date(evaluation.reviewed_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

