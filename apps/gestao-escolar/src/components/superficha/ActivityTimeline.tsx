import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, FileText, UserCheck, Calendar, User } from 'lucide-react';
import { ActivityTimelineItem } from '../../services/superfichaService';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  activities: ActivityTimelineItem[];
  className?: string;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'diary_entry':
        return <BookOpen className="h-4 w-4" />;
      case 'pei_change':
        return <FileText className="h-4 w-4" />;
      case 'enrollment_change':
        return <UserCheck className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'diary_entry':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'pei_change':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'enrollment_change':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'document':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  if (activities.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade registrada ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline de Atividades
          <Badge variant="secondary" className="ml-2">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha vertical da timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={activity.id || index} className="relative pl-10">
                {/* Ponto da timeline */}
                <div className="absolute left-0 top-1">
                  <div className={cn(
                    'h-3 w-3 rounded-full border-2 border-background',
                    'bg-blue-500'
                  )}></div>
                </div>

                {/* Conteúdo da atividade */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={cn(
                        'p-1.5 rounded border',
                        getActivityColor(activity.type)
                      )}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', getActivityColor(activity.type))}>
                      {activity.type === 'diary_entry' && 'Diário'}
                      {activity.type === 'pei_change' && 'PEI'}
                      {activity.type === 'enrollment_change' && 'Matrícula'}
                      {activity.type === 'document' && 'Documento'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(activity.date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {activity.created_by && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Por usuário</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata adicional se houver */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      {activity.metadata.entry_type && (
                        <div>
                          <span className="font-medium">Tipo:</span>{' '}
                          <span className="capitalize">{activity.metadata.entry_type}</span>
                        </div>
                      )}
                      {activity.metadata.grade_value && (
                        <div>
                          <span className="font-medium">Nota:</span>{' '}
                          <span>{activity.metadata.grade_value}</span>
                        </div>
                      )}
                      {activity.metadata.status && (
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          <span className="capitalize">{activity.metadata.status}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

