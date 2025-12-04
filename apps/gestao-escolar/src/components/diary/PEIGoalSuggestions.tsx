import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, Link2, X } from 'lucide-react';
import { diaryPEIIntegrationService, PEIGoalSuggestion } from '@/services/diaryPEIIntegrationService';
import { toast } from 'sonner';

interface PEIGoalSuggestionsProps {
  studentId: string;
  activityDescription: string;
  subjectId?: string;
  onLinkGoal?: (goalId: string) => void;
  onDismiss?: () => void;
}

export function PEIGoalSuggestions({
  studentId,
  activityDescription,
  subjectId,
  onLinkGoal,
  onDismiss,
}: PEIGoalSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<PEIGoalSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activityDescription && studentId) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  }, [activityDescription, studentId, subjectId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await diaryPEIIntegrationService.suggestPEIGoals(
        studentId,
        activityDescription,
        subjectId
      );
      setSuggestions(data);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoal = async (goalId: string) => {
    try {
      // Aqui precisaríamos do activityId, mas por enquanto apenas notificamos
      onLinkGoal?.(goalId);
      toast.success('Meta do PEI vinculada à atividade');
    } catch (error) {
      toast.error('Erro ao vincular meta');
      console.error(error);
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  // Mostrar apenas sugestões com score >= 30
  const relevantSuggestions = suggestions.filter((s) => s.match_score >= 30);

  if (relevantSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            Sugestões de Metas do PEI
          </CardTitle>
          {onDismiss && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {relevantSuggestions.map((suggestion) => (
              <div
                key={suggestion.goal_id}
                className="p-3 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{suggestion.goal_description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category === 'academic' ? 'Acadêmica' : 'Funcional'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.match_score}% match
                      </Badge>
                      <span className="text-xs text-muted-foreground">{suggestion.reason}</span>
                    </div>
                  </div>
                  {onLinkGoal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkGoal(suggestion.goal_id)}
                      className="h-8"
                      title="Vincular meta à atividade"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

