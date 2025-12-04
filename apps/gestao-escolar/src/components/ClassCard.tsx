import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { HoverCard } from '@/components/ui/microinteractions';
import { Edit, Trash2, Users, GraduationCap, Clock } from 'lucide-react';
import type { Class } from '@/services/classesService';

interface ClassCardProps {
  classItem: Class;
  onEdit?: (classItem: Class) => void;
  onDelete?: (id: string, name: string) => void;
  onClick?: (classItem: Class) => void;
}

export function ClassCard({ classItem, onEdit, onDelete, onClick }: ClassCardProps) {
  return (
    <HoverCard>
      <Card 
        className="transition-all duration-200 cursor-pointer"
        onClick={() => onClick?.(classItem)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{classItem.class_name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                  {classItem.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
                <Badge variant="outline">
                  {classItem.grade || 'Sem série'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Nível:</span>
              <span className="font-medium">{classItem.education_level || 'N/A'}</span>
            </div>
            {classItem.shift && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Turno:</span>
                <span className="font-medium">{classItem.shift}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Alunos:</span>
              <span className="font-medium">
                {classItem.current_students || 0}/{classItem.max_students || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Escola:</span>{' '}
              <span className="font-medium">{classItem.school?.school_name || 'Sem escola'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ano Letivo:</span>{' '}
              <span className="font-medium">{classItem.academic_year || 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(classItem);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(classItem.id, classItem.class_name);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </HoverCard>
  );
}
