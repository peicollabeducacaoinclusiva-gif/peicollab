import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Target, Package, Plus, TrendingUp } from 'lucide-react';
import { goalMatrixService, GoalTemplate, AdaptationTemplate, DisabilityType, Stage, GoalCategory, AdaptationType } from '@/services/goalMatrixService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface GoalMatrixProps {
  peiId: string;
  studentId: string;
  onGoalCreated?: (goalId: string) => void;
}

export function GoalMatrix({ peiId, studentId, onGoalCreated }: GoalMatrixProps) {
  const [goalTemplates, setGoalTemplates] = useState<GoalTemplate[]>([]);
  const [adaptationTemplates, setAdaptationTemplates] = useState<AdaptationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDisability, setSelectedDisability] = useState<DisabilityType>('deficiencia_intelectual');
  const [selectedStage, setSelectedStage] = useState<Stage | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | ''>('');
  const [selectedAdaptationType, setSelectedAdaptationType] = useState<AdaptationType | ''>('');

  useEffect(() => {
    loadTemplates();
  }, [selectedDisability, selectedStage, selectedCategory]);

  useEffect(() => {
    loadAdaptationTemplates();
  }, [selectedDisability, selectedStage, selectedAdaptationType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await goalMatrixService.getGoalTemplates(
        selectedDisability,
        selectedStage || undefined,
        selectedCategory || undefined
      );
      setGoalTemplates(data);
    } catch (error) {
      toast.error('Erro ao carregar templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdaptationTemplates = async () => {
    try {
      const data = await goalMatrixService.getAdaptationTemplates(
        selectedDisability,
        selectedAdaptationType || undefined,
        selectedStage || undefined
      );
      setAdaptationTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates de adaptação:', error);
    }
  };

  const handleCreateGoalFromTemplate = async (templateId: string) => {
    try {
      const goalId = await goalMatrixService.createGoalFromTemplate(peiId, templateId);
      toast.success('Meta criada a partir do template');
      onGoalCreated?.(goalId);
      await loadTemplates(); // Atualizar contador de uso
    } catch (error) {
      toast.error('Erro ao criar meta');
      console.error(error);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'academic':
        return 'Acadêmica';
      case 'functional':
        return 'Funcional';
      case 'social':
        return 'Social';
      case 'communication':
        return 'Comunicação';
      default:
        return category;
    }
  };

  const getAdaptationTypeLabel = (type: string) => {
    switch (type) {
      case 'curricular':
        return 'Curricular';
      case 'metodologica':
        return 'Metodológica';
      case 'avaliacao':
        return 'Avaliação';
      case 'fisica':
        return 'Física';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Matriz de Metas Reutilizável
        </CardTitle>
        <CardDescription>
          Templates de metas e adaptações por deficiência e etapa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo de Deficiência</Label>
              <Select
                value={selectedDisability}
                onValueChange={(v) => setSelectedDisability(v as DisabilityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deficiencia_intelectual">Deficiência Intelectual</SelectItem>
                  <SelectItem value="autismo">Autismo</SelectItem>
                  <SelectItem value="tdah">TDAH</SelectItem>
                  <SelectItem value="deficiencia_visual">Deficiência Visual</SelectItem>
                  <SelectItem value="deficiencia_auditiva">Deficiência Auditiva</SelectItem>
                  <SelectItem value="deficiencia_fisica">Deficiência Física</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Etapa</Label>
              <Select
                value={selectedStage}
                onValueChange={(v) => setSelectedStage(v as Stage | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="infantil">Educação Infantil</SelectItem>
                  <SelectItem value="fundamental_anos_iniciais">Fundamental - Anos Iniciais</SelectItem>
                  <SelectItem value="fundamental_anos_finais">Fundamental - Anos Finais</SelectItem>
                  <SelectItem value="medio">Ensino Médio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria de Meta</Label>
              <Select
                value={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v as GoalCategory | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="academic">Acadêmica</SelectItem>
                  <SelectItem value="functional">Funcional</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="communication">Comunicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="goals" className="w-full">
            <TabsList>
              <TabsTrigger value="goals">
                <Target className="h-4 w-4 mr-2" />
                Templates de Metas ({goalTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="adaptations">
                <Package className="h-4 w-4 mr-2" />
                Templates de Adaptações ({adaptationTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : goalTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum template encontrado para os filtros selecionados
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goalTemplates.map((template) => (
                      <div key={template.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{template.title}</h4>
                              <Badge variant="outline">{getCategoryLabel(template.goal_category)}</Badge>
                              {template.usage_count > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {template.usage_count} usos
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                            {template.suggested_strategies && template.suggested_strategies.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Estratégias Sugeridas:</p>
                                <div className="flex flex-wrap gap-1">
                                  {template.suggested_strategies.map((strategy, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {strategy}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {template.suggested_resources && template.suggested_resources.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Recursos Sugeridos:</p>
                                <div className="flex flex-wrap gap-1">
                                  {template.suggested_resources.map((resource, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {resource}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateGoalFromTemplate(template.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Usar Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="adaptations" className="space-y-4">
              <div className="mb-4">
                <Label>Tipo de Adaptação</Label>
                <Select
                  value={selectedAdaptationType}
                  onValueChange={(v) => setSelectedAdaptationType(v as AdaptationType | '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="curricular">Curricular</SelectItem>
                    <SelectItem value="metodologica">Metodológica</SelectItem>
                    <SelectItem value="avaliacao">Avaliação</SelectItem>
                    <SelectItem value="fisica">Física</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                {adaptationTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum template de adaptação encontrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adaptationTemplates.map((template) => (
                      <div key={template.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{template.title}</h4>
                              <Badge variant="outline">
                                {getAdaptationTypeLabel(template.adaptation_type)}
                              </Badge>
                              {template.usage_count > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {template.usage_count} usos
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                            {template.resources_needed && template.resources_needed.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Recursos Necessários:</p>
                                <div className="flex flex-wrap gap-1">
                                  {template.resources_needed.map((resource, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {resource}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {template.implementation_notes && (
                              <p className="text-xs text-muted-foreground mt-2">
                                <span className="font-medium">Notas:</span> {template.implementation_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

