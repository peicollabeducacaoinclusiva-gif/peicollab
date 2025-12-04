// src/components/support/FeedbackHistory.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smile, Meh, Frown, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FeedbackHistoryProps {
  studentId: string;
}

interface Feedback {
  id: string;
  feedback_date: string;
  socialization_score: number;
  autonomy_score: number;
  behavior_score: number;
  comments: string | null;
  created_at: string;
}

export function FeedbackHistory({ studentId }: FeedbackHistoryProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, [studentId]);

  const loadFeedbacks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_professional_feedbacks')
        .select('*')
        .eq('student_id', studentId)
        .eq('support_professional_id', user.id)
        .order('feedback_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <Smile className="h-4 w-4 text-green-600" />;
    if (score === 3) return <Meh className="h-4 w-4 text-yellow-600" />;
    return <Frown className="h-4 w-4 text-red-600" />;
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 4) return "default";
    if (score === 3) return "secondary";
    return "destructive";
  };

  // Preparar dados para o gráfico
  const chartData = feedbacks
    .slice(0, 14) // Últimas 2 semanas
    .reverse()
    .map((feedback) => ({
      date: format(new Date(feedback.feedback_date), 'dd/MM', { locale: ptBR }),
      Socialização: feedback.socialization_score,
      Autonomia: feedback.autonomy_score,
      Comportamento: feedback.behavior_score,
    }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Feedbacks</CardTitle>
          <CardDescription>Nenhum feedback registrado ainda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum feedback foi registrado para este aluno.</p>
            <p className="text-sm mt-2">
              Use a aba "Registrar Feedback" para criar o primeiro registro.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução (Últimas 2 Semanas)</CardTitle>
          <CardDescription>
            Acompanhamento visual do desenvolvimento do aluno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Socialização"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Autonomia"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Comportamento"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista de Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
          <CardDescription>
            Últimos {feedbacks.length} feedbacks registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <Card key={feedback.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(feedback.feedback_date), "PPP", { locale: ptBR })}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(feedback.created_at), "HH:mm", { locale: ptBR })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      {/* Socialização */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getScoreIcon(feedback.socialization_score)}
                          <span>Socialização</span>
                        </div>
                        <Badge variant={getScoreBadgeVariant(feedback.socialization_score)}>
                          {feedback.socialization_score}/5
                        </Badge>
                      </div>

                      {/* Autonomia */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getScoreIcon(feedback.autonomy_score)}
                          <span>Autonomia</span>
                        </div>
                        <Badge variant={getScoreBadgeVariant(feedback.autonomy_score)}>
                          {feedback.autonomy_score}/5
                        </Badge>
                      </div>

                      {/* Comportamento */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getScoreIcon(feedback.behavior_score)}
                          <span>Comportamento</span>
                        </div>
                        <Badge variant={getScoreBadgeVariant(feedback.behavior_score)}>
                          {feedback.behavior_score}/5
                        </Badge>
                      </div>
                    </div>

                    {/* Comentários */}
                    {feedback.comments && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{feedback.comments}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}































