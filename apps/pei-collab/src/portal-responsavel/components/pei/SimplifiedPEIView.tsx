import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Target, Package, CheckCircle, Clock } from 'lucide-react';
import { simplifiedPEIService, SimplifiedPEI } from '../services/simplifiedPEIService';
import { toast } from 'sonner';

interface SimplifiedPEIViewProps {
  studentId: string;
  familyMemberId: string;
}

export function SimplifiedPEIView({ studentId, familyMemberId }: SimplifiedPEIViewProps) {
  const [pei, setPEI] = useState<SimplifiedPEI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPEI();
  }, [studentId, familyMemberId]);

  const loadPEI = async () => {
    try {
      setLoading(true);
      const data = await simplifiedPEIService.getSimplifiedPEI(studentId, familyMemberId);
      setPEI(data);
    } catch (error) {
      toast.error('Erro ao carregar PEI');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressIcon = (progress?: string) => {
    switch (progress) {
      case 'alcançada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'em andamento':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProgressValue = (progress?: string): number => {
    switch (progress) {
      case 'alcançada':
        return 100;
      case 'em andamento':
        return 50;
      case 'parcialmente alcançada':
        return 75;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PEI Simplificado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pei) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PEI Simplificado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum PEI aprovado encontrado para este aluno
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PEI Simplificado - {pei.student_name}
        </CardTitle>
        <CardDescription>
          Plano Educacional Individualizado em versão simplificada e acessível
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metas */}
        {pei.goals && pei.goals.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Target className="h-4 w-4" />
              Metas ({pei.goals.length})
            </h3>
            <div className="space-y-3">
              {pei.goals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getProgressIcon(goal.progress_level)}
                        <span className="font-medium">{goal.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {goal.category}
                        </Badge>
                      </div>
                      {goal.target_date && (
                        <p className="text-xs text-muted-foreground">
                          Data alvo: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {goal.progress_level || 'Não iniciada'}
                      </span>
                    </div>
                    <Progress value={getProgressValue(goal.progress_level)} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adaptações */}
        {pei.adaptations && pei.adaptations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Package className="h-4 w-4" />
              Adaptações ({pei.adaptations.length})
            </h3>
            <div className="space-y-2">
              {pei.adaptations.map((adaptation, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {adaptation.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{adaptation.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recursos */}
        {pei.resources && pei.resources.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Package className="h-4 w-4" />
              Recursos ({pei.resources.length})
            </h3>
            <div className="space-y-2">
              {pei.resources.map((resource, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {resource.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

