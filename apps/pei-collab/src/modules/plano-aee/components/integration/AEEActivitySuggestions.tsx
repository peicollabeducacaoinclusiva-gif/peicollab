import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, Plus, CheckCircle } from 'lucide-react';
import { peiIntegrationService, AEEActivitySuggestion } from '@/services/peiIntegrationService';
import { toast } from 'sonner';

interface AEEActivitySuggestionsProps {
  studentId: string;
  onSuggestionAccept?: (suggestion: AEEActivitySuggestion['suggested_activities'][0], goalId: string) => void;
}

export function AEEActivitySuggestions({ studentId, onSuggestionAccept }: AEEActivitySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AEEActivitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [studentId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await peiIntegrationService.getActivitySuggestions(studentId);
      setSuggestions(data);
    } catch (error) {
      toast.error('Erro ao carregar sugestões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (suggestion: AEEActivitySuggestion['suggested_activities'][0], goalId: string) => {
    onSuggestionAccept?.(suggestion, goalId);
    toast.success('Sugestão aceita');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando sugestões...</p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhuma sugestão disponível no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Sugestões de Atividades AEE
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.goal_id} className="p-4 rounded-lg border bg-card">
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-1">Meta: {suggestion.goal_description}</h4>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.suggested_activities.length} sugestões disponíveis
                  </p>
                </div>
                <div className="space-y-2">
                  {suggestion.suggested_activities.map((activity, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {activity.activity_type}
                            </Badge>
                          </div>
                          <p className="text-sm">{activity.description}</p>
                          {activity.methodology && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Metodologia:</span> {activity.methodology}
                            </p>
                          )}
                          {activity.resources && activity.resources.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Recursos:</p>
                              <div className="flex flex-wrap gap-1">
                                {activity.resources.map((resource, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {resource}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {onSuggestionAccept && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAccept(activity, suggestion.goal_id)}
                            className="h-8 w-8 p-0"
                            title="Aceitar sugestão"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


