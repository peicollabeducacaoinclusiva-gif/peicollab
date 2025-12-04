// src/components/pei/EvaluationReport.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, XCircle, TrendingUp, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Evaluation {
  id: string;
  cycle_number: number;
  cycle_name: string;
  completed_at: string;
  goals_achievement: any[];
  modifications_needed: string;
  overall_notes: string;
  next_steps: string;
  strengths: string;
  challenges: string;
}

interface EvaluationReportProps {
  peiId: string;
}

export function EvaluationReport({ peiId }: EvaluationReportProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvaluations();
  }, [peiId]);

  const loadEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('pei_evaluations')
        .select('*')
        .eq('pei_id', peiId)
        .eq('is_completed', true)
        .order('cycle_number', { ascending: true });

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Preparar dados para gráficos
  const prepareChartData = () => {
    return evaluations.map((evaluation) => {
      const goals = evaluation.goals_achievement || [];
      const achieved = goals.filter((g: any) => g.status === 'achieved').length;
      const partial = goals.filter((g: any) => g.status === 'partial').length;
      const notAchieved = goals.filter((g: any) => g.status === 'not_achieved').length;
      const totalGoals = goals.length;
      const achievementRate =
        totalGoals > 0 ? ((achieved + partial * 0.5) / totalGoals) * 100 : 0;

      return {
        cycle: evaluation.cycle_name,
        achievementRate: Math.round(achievementRate),
        achieved,
        partial,
        notAchieved,
        totalGoals,
      };
    });
  };

  const chartData = prepareChartData();

  // Dados para gráfico de pizza (última avaliação)
  const latestEvaluation = evaluations[evaluations.length - 1];
  const pieData = latestEvaluation
    ? [
        {
          name: 'Alcançadas',
          value: latestEvaluation.goals_achievement?.filter((g: any) => g.status === 'achieved')
            .length || 0,
          color: '#22c55e',
        },
        {
          name: 'Parciais',
          value: latestEvaluation.goals_achievement?.filter((g: any) => g.status === 'partial')
            .length || 0,
          color: '#eab308',
        },
        {
          name: 'Não Alcançadas',
          value: latestEvaluation.goals_achievement?.filter(
            (g: any) => g.status === 'not_achieved'
          ).length || 0,
          color: '#ef4444',
        },
      ]
    : [];

  const getStatusIcon = (status: string) => {
    if (status === 'achieved')
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'partial')
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma avaliação registrada ainda.</p>
            <p className="text-sm mt-2">
              As avaliações aparecerão aqui após serem preenchidas pelos professores.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ciclos Avaliados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">De 3 ciclos totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Alcance Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.length > 0
                ? Math.round(
                    chartData.reduce((acc, curr) => acc + curr.achievementRate, 0) /
                      chartData.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Média geral dos ciclos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Última Avaliação</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestEvaluation?.cycle_name}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestEvaluation &&
                format(new Date(latestEvaluation.completed_at), 'dd/MM/yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        {/* Gráfico de Progresso */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Taxa de Alcance</CardTitle>
              <CardDescription>
                Acompanhamento do progresso ao longo dos ciclos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="achievementRate"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Taxa de Alcance (%)"
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Detalhamento por Ciclo</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cycle" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="achieved" fill="#22c55e" name="Alcançadas" />
                    <Bar dataKey="partial" fill="#eab308" name="Parciais" />
                    <Bar dataKey="notAchieved" fill="#ef4444" name="Não Alcançadas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribuição Atual */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Atual das Metas</CardTitle>
              <CardDescription>
                Status das metas no {latestEvaluation?.cycle_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {pieData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant="secondary">{item.value} metas</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detalhes das Avaliações */}
        <TabsContent value="details">
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{evaluation.cycle_name}</CardTitle>
                    <Badge variant="default">
                      {format(new Date(evaluation.completed_at), 'dd/MM/yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metas */}
                  <div>
                    <h4 className="font-semibold mb-2">Metas Avaliadas</h4>
                    <div className="space-y-2">
                      {evaluation.goals_achievement?.map((goal: any, index: number) => (
                        <div
                          key={goal.goal_id}
                          className="flex items-start gap-2 p-2 border rounded"
                        >
                          {getStatusIcon(goal.status)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {index + 1}. {goal.goal_title}
                            </p>
                            {goal.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {goal.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  {evaluation.strengths && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Pontos Fortes</h4>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.strengths}
                      </p>
                    </div>
                  )}

                  {evaluation.challenges && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Desafios</h4>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.challenges}
                      </p>
                    </div>
                  )}

                  {evaluation.next_steps && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Próximos Passos</h4>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.next_steps}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

