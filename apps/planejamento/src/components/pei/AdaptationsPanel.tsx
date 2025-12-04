import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Plus } from 'lucide-react';
import { peiConnectionService, PlanningInsights } from '@/services/peiConnectionService';
import { toast } from 'sonner';

interface AdaptationsPanelProps {
  classId: string;
  planningId?: string;
  onAdaptationSelect?: (adaptation: any) => void;
}

export function AdaptationsPanel({ classId, planningId, onAdaptationSelect }: AdaptationsPanelProps) {
  const [adaptations, setAdaptations] = useState<Array<{
    adaptation_type: string;
    description: string;
    student_id: string;
    student_name: string;
  }>>([]);
  const [selectedAdaptations, setSelectedAdaptations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdaptations();
  }, [classId]);

  const loadAdaptations = async () => {
    try {
      setLoading(true);
      const insights = await peiConnectionService.getPlanningInsights(classId);
      setAdaptations(insights.adaptations || []);
    } catch (error) {
      toast.error('Erro ao carregar adaptações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdaptation = (index: number) => {
    const newSelected = new Set(selectedAdaptations);
    const key = `adaptation-${index}`;
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedAdaptations(newSelected);
    
    if (onAdaptationSelect && planningId) {
      const adaptation = adaptations[index];
      onAdaptationSelect(adaptation);
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
      case 'arquitetural':
        return 'Arquitetônica';
      case 'comunicacional':
        return 'Comunicacional';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Adaptações Sugeridas</CardTitle>
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
          <Package className="h-5 w-5" />
          Adaptações Sugeridas
        </CardTitle>
        <CardDescription>
          Adaptações necessárias para alunos com PEI nesta turma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {adaptations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma adaptação necessária para esta turma
          </div>
        ) : (
          <div className="space-y-3">
            {adaptations.map((adaptation, index) => {
              const key = `adaptation-${index}`;
              const isSelected = selectedAdaptations.has(key);

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 border-primary' : 'bg-card'
                  }`}
                  onClick={() => handleToggleAdaptation(index)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{adaptation.student_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {getAdaptationTypeLabel(adaptation.adaptation_type)}
                        </Badge>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{adaptation.description}</p>
                    </div>
                    {planningId && (
                      <Button
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAdaptation(index);
                        }}
                      >
                        {isSelected ? 'Remover' : 'Adicionar'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
