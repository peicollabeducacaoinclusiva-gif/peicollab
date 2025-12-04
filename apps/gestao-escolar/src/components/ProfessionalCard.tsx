import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { HoverCard } from '@/components/ui/microinteractions';
import { Edit, Trash2, Mail, Phone, School, UserCheck } from 'lucide-react';
import type { Professional } from '@/services/professionalsService';

interface ProfessionalCardProps {
  professional: Professional;
  onEdit?: (professional: Professional) => void;
  onDelete?: (professional: Professional) => void;
  onClick?: (professional: Professional) => void;
}

export function ProfessionalCard({ 
  professional, 
  onEdit, 
  onDelete, 
  onClick 
}: ProfessionalCardProps) {
  return (
    <HoverCard>
      <Card 
        className="transition-all duration-200 cursor-pointer"
        onClick={() => onClick?.(professional)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{professional.full_name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={professional.is_active ? 'default' : 'secondary'}>
                  {professional.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                <Badge variant="outline">
                  {professional.professional_role || 'Sem função'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {professional.registration_number && (
              <div>
                <span className="text-muted-foreground">Matrícula:</span>{' '}
                <span className="font-medium">{professional.registration_number}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Escola:</span>
              <span className="font-medium truncate">
                {professional.school?.school_name || 'Sem escola'}
              </span>
            </div>
            {professional.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium truncate">{professional.email}</span>
              </div>
            )}
            {professional.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{professional.phone}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(professional);
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
                  onDelete(professional);
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
