import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, BookOpen, Package, Calendar } from 'lucide-react';
import { structuredPlanService, StructuredAEEPlan, AEEObjective, AEEMethodology, AEEAssistiveTechnology } from '@/services/structuredPlanService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StructuredPlanProps {
  aeeId: string;
}

export function StructuredPlan({ aeeId }: StructuredPlanProps) {
  const [plan, setPlan] = useState<StructuredAEEPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
  const [methodologyDialogOpen, setMethodologyDialogOpen] = useState(false);
  const [technologyDialogOpen, setTechnologyDialogOpen] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [aeeId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await structuredPlanService.getStructuredPlan(aeeId);
      setPlan(data);
    } catch (error) {
      toast.error('Erro ao carregar plano estruturado');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObjective = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await structuredPlanService.createObjective({
        aee_id: aeeId,
        objective_type: formData.get('objective_type') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        target_date: formData.get('target_date') as string || undefined,
        status: 'active',
      });
      toast.success('Objetivo criado');
      setObjectiveDialogOpen(false);
      await loadPlan();
    } catch (error) {
      toast.error('Erro ao criar objetivo');
      console.error(error);
    }
  };

  const handleCreateMethodology = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await structuredPlanService.createMethodology({
        aee_id: aeeId,
        methodology_name: formData.get('methodology_name') as string,
        description: formData.get('description') as string,
        frequency: formData.get('frequency') as string || undefined,
        duration_minutes: formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : undefined,
      });
      toast.success('Metodologia criada');
      setMethodologyDialogOpen(false);
      await loadPlan();
    } catch (error) {
      toast.error('Erro ao criar metodologia');
      console.error(error);
    }
  };

  const handleCreateTechnology = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await structuredPlanService.createAssistiveTechnology({
        aee_id: aeeId,
        technology_type: formData.get('technology_type') as string,
        technology_name: formData.get('technology_name') as string,
        description: formData.get('description') as string || undefined,
        usage_frequency: formData.get('usage_frequency') as string || undefined,
        provider: formData.get('provider') as string || undefined,
        training_required: formData.get('training_required') === 'true',
        training_completed: formData.get('training_completed') === 'true',
      });
      toast.success('Tecnologia assistiva criada');
      setTechnologyDialogOpen(false);
      await loadPlan();
    } catch (error) {
      toast.error('Erro ao criar tecnologia assistiva');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plano Estruturado AEE</CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Plano Estruturado AEE
        </CardTitle>
        <CardDescription>
          Objetivos, metodologias, tecnologias assistivas e plano semanal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="objectives" className="w-full">
          <TabsList>
            <TabsTrigger value="objectives">
              <Target className="h-4 w-4 mr-2" />
              Objetivos ({plan?.objectives.length || 0})
            </TabsTrigger>
            <TabsTrigger value="methodologies">
              <BookOpen className="h-4 w-4 mr-2" />
              Metodologias ({plan?.methodologies.length || 0})
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Package className="h-4 w-4 mr-2" />
              Tecnologias ({plan?.assistive_technologies.length || 0})
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <Calendar className="h-4 w-4 mr-2" />
              Plano Semanal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="objectives" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={objectiveDialogOpen} onOpenChange={setObjectiveDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Objetivo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Objetivo</DialogTitle>
                    <DialogDescription>
                      Crie um objetivo específico para o plano AEE
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateObjective} className="space-y-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select name="objective_type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="academic">Acadêmico</SelectItem>
                          <SelectItem value="functional">Funcional</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="communication">Comunicação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Título</Label>
                      <Input name="title" required />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea name="description" required />
                    </div>
                    <div>
                      <Label>Data Alvo</Label>
                      <Input name="target_date" type="date" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setObjectiveDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Criar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {plan?.objectives.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum objetivo criado ainda
                </p>
              ) : (
                plan?.objectives.map((objective) => (
                  <div key={objective.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{objective.title}</h4>
                          <Badge variant="outline">{objective.objective_type}</Badge>
                          <Badge variant={objective.status === 'active' ? 'default' : 'secondary'}>
                            {objective.status === 'active' ? 'Ativo' : objective.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{objective.description}</p>
                        {objective.target_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Data alvo: {new Date(objective.target_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="methodologies" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={methodologyDialogOpen} onOpenChange={setMethodologyDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Metodologia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Metodologia</DialogTitle>
                    <DialogDescription>
                      Adicione uma metodologia utilizada no AEE
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMethodology} className="space-y-4">
                    <div>
                      <Label>Nome da Metodologia</Label>
                      <Input name="methodology_name" required />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea name="description" required />
                    </div>
                    <div>
                      <Label>Frequência</Label>
                      <Select name="frequency">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diaria">Diária</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="quinzenal">Quinzenal</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duração (minutos)</Label>
                      <Input name="duration_minutes" type="number" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setMethodologyDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Criar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {plan?.methodologies.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma metodologia registrada
                </p>
              ) : (
                plan?.methodologies.map((methodology) => (
                  <div key={methodology.id} className="p-4 rounded-lg border bg-card">
                    <h4 className="font-medium mb-2">{methodology.methodology_name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{methodology.description}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {methodology.frequency && (
                        <Badge variant="outline">Frequência: {methodology.frequency}</Badge>
                      )}
                      {methodology.duration_minutes && (
                        <Badge variant="outline">Duração: {methodology.duration_minutes} min</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="technologies" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={technologyDialogOpen} onOpenChange={setTechnologyDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tecnologia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Tecnologia Assistiva</DialogTitle>
                    <DialogDescription>
                      Registre uma tecnologia assistiva utilizada
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTechnology} className="space-y-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select name="technology_type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comunicacao">Comunicação</SelectItem>
                          <SelectItem value="mobilidade">Mobilidade</SelectItem>
                          <SelectItem value="acesso_informacao">Acesso à Informação</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome da Tecnologia</Label>
                      <Input name="technology_name" required />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea name="description" />
                    </div>
                    <div>
                      <Label>Frequência de Uso</Label>
                      <Select name="usage_frequency">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diario">Diário</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="sob_demanda">Sob Demanda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Fornecedor</Label>
                      <Select name="provider">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="escola">Escola</SelectItem>
                          <SelectItem value="familia">Família</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <Label>Treinamento Necessário</Label>
                        <Select name="training_required" defaultValue="false">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Treinamento Concluído</Label>
                        <Select name="training_completed" defaultValue="false">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setTechnologyDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Criar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {plan?.assistive_technologies.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma tecnologia assistiva registrada
                </p>
              ) : (
                plan?.assistive_technologies.map((technology) => (
                  <div key={technology.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{technology.technology_name}</h4>
                          <Badge variant="outline">{technology.technology_type}</Badge>
                        </div>
                        {technology.description && (
                          <p className="text-sm text-muted-foreground mb-2">{technology.description}</p>
                        )}
                        <div className="flex gap-2 text-xs">
                          {technology.usage_frequency && (
                            <Badge variant="secondary">Uso: {technology.usage_frequency}</Badge>
                          )}
                          {technology.provider && (
                            <Badge variant="secondary">Fornecedor: {technology.provider}</Badge>
                          )}
                          {technology.training_required && (
                            <Badge variant={technology.training_completed ? 'default' : 'destructive'}>
                              Treinamento: {technology.training_completed ? 'Concluído' : 'Pendente'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <p className="text-muted-foreground text-center py-4">
              Plano semanal em desenvolvimento
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

