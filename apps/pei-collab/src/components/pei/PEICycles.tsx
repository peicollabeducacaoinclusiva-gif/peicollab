import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, Play, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { peiCyclesService, PEICycle } from '@/services/peiCyclesService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PEICyclesProps {
  peiId: string;
}

export function PEICycles({ peiId }: PEICyclesProps) {
  const [cycles, setCycles] = useState<PEICycle[]>([]);
  const [currentCycle, setCurrentCycle] = useState<PEICycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadCycles();
  }, [peiId]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const [cyclesData, currentCycleData] = await Promise.all([
        peiCyclesService.getCycles(peiId),
        peiCyclesService.getCurrentCycle(peiId),
      ]);

      setCycles(cyclesData);
      setCurrentCycle(currentCycleData);
    } catch (error) {
      toast.error('Erro ao carregar ciclos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaultCycles = async () => {
    try {
      await peiCyclesService.createDefaultCycles(peiId);
      await loadCycles();
      toast.success('Ciclos padrão criados com sucesso');
    } catch (error) {
      toast.error('Erro ao criar ciclos');
      console.error(error);
    }
  };

  const handleCompleteCycle = async (cycleId: string) => {
    if (!confirm('Tem certeza que deseja finalizar este ciclo?')) return;

    try {
      await peiCyclesService.completeCycle(cycleId);
      await loadCycles();
      toast.success('Ciclo finalizado e próximo ciclo ativado');
    } catch (error) {
      toast.error('Erro ao finalizar ciclo');
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Ativo</Badge>;
      case 'completed':
        return <Badge variant="default">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const calculateCycleProgress = (cycle: PEICycle): number => {
    const start = new Date(cycle.start_date).getTime();
    const end = new Date(cycle.end_date).getTime();
    const now = new Date().getTime();

    if (now < start) return 0;
    if (now > end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ciclos do PEI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando ciclos...</p>
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
              <Calendar className="h-5 w-5" />
              Ciclos do PEI
            </CardTitle>
            <CardDescription>
              Estrutura avaliativa organizada por ciclos conforme BNCC
            </CardDescription>
          </div>
          {cycles.length === 0 && (
            <Button onClick={handleCreateDefaultCycles} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Criar Ciclos Padrão
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cycles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhum ciclo criado. Clique em "Criar Ciclos Padrão" para criar automaticamente.
            </p>
            <Button onClick={handleCreateDefaultCycles} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Criar Ciclos Padrão (I, II, III)
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={currentCycle?.id || cycles[0]?.id} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${cycles.length}, 1fr)` }}>
              {cycles.map((cycle) => (
                <TabsTrigger key={cycle.id} value={cycle.id} className="flex items-center gap-2">
                  {getStatusIcon(cycle.status)}
                  <span>{cycle.cycle_name || `${cycle.cycle_number}º Ciclo`}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {cycles.map((cycle) => {
              const progress = calculateCycleProgress(cycle);
              const isActive = cycle.status === 'active';

              return (
                <TabsContent key={cycle.id} value={cycle.id}>
                  <div className="space-y-4">
                    {/* Informações do Ciclo */}
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {cycle.cycle_name || `${cycle.cycle_number}º Ciclo`}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(cycle.status)}
                            {isActive && (
                              <Badge variant="outline" className="text-xs">
                                {progress}% do período
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteCycle(cycle.id)}
                          >
                            Finalizar Ciclo
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Data de Início</p>
                          <p className="font-medium">
                            {format(new Date(cycle.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data de Término</p>
                          <p className="font-medium">
                            {format(new Date(cycle.end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progresso do Período</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </div>

                    {/* Metas do Ciclo */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Metas do Ciclo</h4>
                      <div className="space-y-2">
                        {cycle.goals_summary && cycle.goals_summary.length > 0 ? (
                          cycle.goals_summary.map((goal: any, index: number) => (
                            <div key={index} className="p-3 rounded-lg border bg-card">
                              <p className="text-sm">{goal.goal_description}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {goal.progress_level}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma meta vinculada a este ciclo
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Observações */}
                    {cycle.observations && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Observações</h4>
                        <p className="text-sm text-muted-foreground p-3 rounded-lg border bg-card">
                          {cycle.observations}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

