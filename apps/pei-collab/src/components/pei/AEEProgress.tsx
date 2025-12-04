import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { aeeIntegrationService, AEEProgress } from '@/services/aeeIntegrationService';
import { toast } from 'sonner';

interface AEEProgressProps {
  peiId: string;
}

export function AEEProgress({ peiId }: AEEProgressProps) {
  const [progress, setProgress] = useState<AEEProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [peiId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await aeeIntegrationService.getAEEProgress(peiId);
      setProgress(data);
    } catch (error) {
      toast.error('Erro ao carregar progresso do AEE');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (progressLevel: string): number => {
    switch (progressLevel) {
      case 'alcançada':
        return 100;
      case 'parcialmente alcançada':
        return 66;
      case 'em andamento':
        return 33;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Progresso do AEE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando progresso...</p>
        </CardContent>
      </Card>
    );
  }

  if (progress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Progresso do AEE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum progresso do AEE vinculado às metas do PEI
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Progresso do AEE por Meta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {progress.map((item) => {
              const progressPercentage = getProgressPercentage(item.overall_progress);

              return (
                <div key={item.goal_id} className="p-4 rounded-lg border bg-card">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-2">{item.goal_description}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          item.overall_progress === 'alcançada'
                            ? 'default'
                            : item.overall_progress === 'em andamento'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {item.overall_progress}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.total_sessions} sessões
                      </span>
                      {item.last_session_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.last_session_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {item.aee_sessions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Últimas Sessões:</p>
                      {item.aee_sessions.slice(0, 3).map((session, index) => (
                        <div key={index} className="p-2 rounded bg-muted/50 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(session.date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {session.progress && (
                              <Badge variant="outline" className="text-xs">
                                {session.progress}
                              </Badge>
                            )}
                          </div>
                          {session.notes && (
                            <p className="text-muted-foreground mt-1">{session.notes}</p>
                          )}
                          {session.activities && session.activities.length > 0 && (
                            <div className="mt-1">
                              <span className="text-muted-foreground">Atividades: </span>
                              <span className="text-xs">{session.activities.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

