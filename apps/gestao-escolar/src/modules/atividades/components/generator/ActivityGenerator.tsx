import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { Input } from '@pei/ui';
import { Sparkles, Target, Users, BookOpen } from 'lucide-react';
import { activityGeneratorService, ActivityBank } from '../../../services/activityGeneratorService';
import { toast } from 'sonner';
import { supabase } from '@pei/database';

interface ActivityGeneratorProps {
  classId: string;
  studentId?: string;
  peiGoalId?: string;
  aeeObjectiveId?: string;
  onActivityGenerated?: (activityId: string) => void;
}

export function ActivityGenerator({ 
  classId, 
  studentId, 
  peiGoalId, 
  aeeObjectiveId,
  onActivityGenerated 
}: ActivityGeneratorProps) {
  const [activityBank, setActivityBank] = useState<ActivityBank[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [knowledgeArea, setKnowledgeArea] = useState<string>('');

  useEffect(() => {
    loadActivityBank();
  }, [stage, knowledgeArea]);

  const loadActivityBank = async () => {
    try {
      setLoading(true);
      const data = await activityGeneratorService.searchActivityBank(
        stage || undefined,
        knowledgeArea || undefined
      );
      setActivityBank(data);
    } catch (error) {
      toast.error('Erro ao carregar banco de atividades');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!studentId) {
      toast.error('Selecione um aluno primeiro');
      return;
    }

    try {
      setGenerating(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const activityId = await activityGeneratorService.generateFromPEIAEE(
        studentId,
        classId,
        user.id,
        peiGoalId,
        aeeObjectiveId,
        selectedActivity || undefined
      );

      toast.success('Atividade gerada com sucesso');
      onActivityGenerated?.(activityId);
    } catch (error) {
      toast.error('Erro ao gerar atividade');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Gerador Automático de Atividades
        </CardTitle>
        <CardDescription>
          Gere atividades adaptadas baseadas em PEI/AEE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Etapa</Label>
            <Select value={stage} onValueChange={setStage}>
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
            <Label>Área do Conhecimento</Label>
            <Select value={knowledgeArea} onValueChange={setKnowledgeArea}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="Linguagens">Linguagens</SelectItem>
                <SelectItem value="Matemática">Matemática</SelectItem>
                <SelectItem value="Ciências da Natureza">Ciências da Natureza</SelectItem>
                <SelectItem value="Ciências Humanas">Ciências Humanas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Banco de Atividades */}
        {peiGoalId && (
          <div className="p-3 rounded-lg border bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Meta do PEI vinculada</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A atividade será adaptada para esta meta
            </p>
          </div>
        )}

        {aeeObjectiveId && (
          <div className="p-3 rounded-lg border bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Objetivo AEE vinculado</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A atividade será adaptada para este objetivo
            </p>
          </div>
        )}

        {/* Lista de Atividades do Banco */}
        <div>
          <Label>Atividade Base (Opcional)</Label>
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : activityBank.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade encontrada
              </p>
            ) : (
              activityBank.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedActivity === activity.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card'
                  }`}
                  onClick={() => setSelectedActivity(activity.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">{activity.activity_name}</h4>
                        {activity.rating > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            ⭐ {activity.rating.toFixed(1)}
                          </Badge>
                        )}
                        {activity.usage_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {activity.usage_count} usos
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {activity.activity_description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {activity.knowledge_area && (
                          <Badge variant="outline" className="text-xs">
                            {activity.knowledge_area}
                          </Badge>
                        )}
                        {activity.tags?.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGenerate}
          disabled={generating || !studentId}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {generating ? 'Gerando...' : 'Gerar Atividade Adaptada'}
        </Button>

        {!studentId && (
          <p className="text-xs text-muted-foreground text-center">
            Selecione um aluno para gerar atividade
          </p>
        )}
      </CardContent>
    </Card>
  );
}

