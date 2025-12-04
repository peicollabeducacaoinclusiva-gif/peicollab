import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, AlertCircle, TrendingUp, BookOpen, Users, CheckCircle2 } from 'lucide-react';
import { StudentSuggestions } from '../../services/superfichaService';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SuggestionsPanelProps {
  suggestions: StudentSuggestions;
  studentId: string;
  className?: string;
}

export function SuggestionsPanel({ suggestions, studentId, className }: SuggestionsPanelProps) {
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'frequency':
        return <Users className="h-4 w-4" />;
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'inclusion':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'create_pei':
        navigate(`/pei/create?studentId=${studentId}`);
        break;
      case 'contact_family':
        // TODO: Implementar ação de contato com família
        console.log('Contatar família');
        break;
      case 'review_performance':
        navigate(`/students/${studentId}?tab=history`);
        break;
      default:
        console.log('Ação não implementada:', action);
    }
  };

  if (suggestions.count === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões Pedagógicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sugestão no momento</p>
            <p className="text-sm">Tudo está bem com este estudante!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Sugestões Pedagógicas
          {suggestions.high_priority_count > 0 && (
            <Badge variant="destructive" className="ml-2">
              {suggestions.high_priority_count} alta prioridade
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-lg border space-y-2',
                suggestion.priority === 'high' && 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
                suggestion.priority === 'medium' && 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20',
                suggestion.priority === 'low' && 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {getTypeIcon(suggestion.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority === 'high' && 'Alta'}
                        {suggestion.priority === 'medium' && 'Média'}
                        {suggestion.priority === 'low' && 'Baixa'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(suggestion.action)}
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Ver ação sugerida
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

