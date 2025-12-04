import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, Target, Wrench, Package, Send, CheckCircle, XCircle, Edit } from 'lucide-react';
import { peiRecommendationsService, Recommendation, StudentClassification, AppliedRecommendation } from '@/services/peiRecommendationsService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RecommendationsPanelProps {
  studentId: string;
  peiId: string;
}

export function RecommendationsPanel({ studentId, peiId }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [classifications, setClassifications] = useState<StudentClassification[]>([]);
  const [appliedRecommendations, setAppliedRecommendations] = useState<AppliedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId, peiId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classificationsData, appliedData] = await Promise.all([
        peiRecommendationsService.getStudentClassifications(studentId),
        peiRecommendationsService.getAppliedRecommendations(studentId, peiId),
      ]);

      setClassifications(classificationsData);
      setAppliedRecommendations(appliedData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setGenerating(true);
      const data = await peiRecommendationsService.generateRecommendations(studentId, peiId);
      setRecommendations(data);
      toast.success(`${data.length} recomendações geradas`);
    } catch (error) {
      toast.error('Erro ao gerar recomendações');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyRecommendation = async (recommendation: Recommendation) => {
    try {
      await peiRecommendationsService.applyRecommendation(
        studentId,
        peiId,
        recommendation,
        recommendation.template_id
      );
      await loadData();
      toast.success('Recomendação aplicada');
    } catch (error) {
      toast.error('Erro ao aplicar recomendação');
      console.error(error);
    }
  };

  const handleUpdateStatus = async (
    recommendationId: string,
    status: 'accepted' | 'rejected' | 'modified'
  ) => {
    try {
      await peiRecommendationsService.updateAppliedRecommendationStatus(recommendationId, status);
      await loadData();
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar status');
      console.error(error);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="h-4 w-4" />;
      case 'strategy':
        return <Wrench className="h-4 w-4" />;
      case 'adaptation':
        return <Package className="h-4 w-4" />;
      case 'resource':
        return <Package className="h-4 w-4" />;
      case 'referral':
        return <Send className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getRecommendationLabel = (type: string) => {
    switch (type) {
      case 'goal':
        return 'Meta';
      case 'strategy':
        return 'Estratégia';
      case 'adaptation':
        return 'Adaptação';
      case 'resource':
        return 'Recurso';
      case 'referral':
        return 'Encaminhamento';
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600';
      case 'medium':
        return 'bg-yellow-600';
      default:
        return 'bg-blue-600';
    }
  };

  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    if (!acc[rec.recommendation_type]) {
      acc[rec.recommendation_type] = [];
    }
    acc[rec.recommendation_type].push(rec);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recomendações Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recomendações Automáticas
            </CardTitle>
            <CardDescription>
              Sugestões baseadas nas classificações do aluno
            </CardDescription>
          </div>
          <Button
            onClick={handleGenerateRecommendations}
            disabled={generating}
            size="sm"
          >
            {generating ? 'Gerando...' : 'Gerar Recomendações'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList>
            <TabsTrigger value="recommendations">
              Recomendações ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="classifications">
              Classificações ({classifications.length})
            </TabsTrigger>
            <TabsTrigger value="applied">
              Aplicadas ({appliedRecommendations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhuma recomendação gerada. Clique em "Gerar Recomendações" para começar.
                </p>
              </div>
            ) : (
              Object.entries(groupedRecommendations).map(([type, items]) => (
                <div key={type} className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {getRecommendationIcon(type)}
                    {getRecommendationLabel(type)}s ({items.length})
                  </h4>
                  <div className="space-y-2">
                    {items.map((recommendation, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPriorityColor(recommendation.priority)}>
                                {recommendation.priority === 'high' ? 'Alta' : recommendation.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                              <span className="text-sm font-medium">{recommendation.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {recommendation.description}
                            </p>
                            {recommendation.content && Object.keys(recommendation.content).length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <details>
                                  <summary className="cursor-pointer">Ver detalhes</summary>
                                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                    {JSON.stringify(recommendation.content, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyRecommendation(recommendation)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="classifications" className="space-y-2">
            {classifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma classificação registrada
              </div>
            ) : (
              classifications.map((classification) => (
                <div key={classification.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{classification.classification}</p>
                      <p className="text-sm text-muted-foreground">
                        {classification.classification_type} • Confiança: {(classification.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Badge variant="outline">
                      {classification.source || 'Manual'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="applied" className="space-y-2">
            {appliedRecommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma recomendação aplicada
              </div>
            ) : (
              appliedRecommendations.map((applied) => (
                <div key={applied.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getRecommendationIcon(applied.recommendation_type)}
                        <span className="font-medium">{applied.title}</span>
                        <Badge
                          variant={
                            applied.status === 'accepted'
                              ? 'default'
                              : applied.status === 'rejected'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {applied.status === 'accepted'
                            ? 'Aceita'
                            : applied.status === 'rejected'
                              ? 'Rejeitada'
                              : applied.status === 'modified'
                                ? 'Modificada'
                                : 'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{applied.description}</p>
                      {applied.notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Notas: {applied.notes}
                        </p>
                      )}
                    </div>
                    {applied.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(applied.id, 'accepted')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(applied.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

