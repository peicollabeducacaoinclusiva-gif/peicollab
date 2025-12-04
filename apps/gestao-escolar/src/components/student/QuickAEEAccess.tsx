import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ExternalLink, Plus } from 'lucide-react';
import type { UnifiedStudentData } from '../../services/unifiedStudentService';

interface QuickAEEAccessProps {
  data: UnifiedStudentData;
  studentId: string;
}

export function QuickAEEAccess({ data, studentId }: QuickAEEAccessProps) {
  const { active_aee } = data;

  const handleViewAEE = () => {
    if (active_aee) {
      // Navegar para o app Plano AEE com o ID do AEE
      window.open(`/aee/${active_aee.id}`, '_blank');
    }
  };

  const handleCreateAEE = () => {
    // Navegar para criar novo AEE com o studentId
    window.open(`/aee/new?studentId=${studentId}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          AEE - Atendimento Educacional Especializado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {active_aee ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status do AEE</p>
                <Badge
                  variant={
                    active_aee.status === 'approved'
                      ? 'default'
                      : active_aee.status === 'pending'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="mt-1"
                >
                  {active_aee.status === 'approved'
                    ? 'Aprovado'
                    : active_aee.status === 'pending'
                      ? 'Pendente'
                      : active_aee.status === 'draft'
                        ? 'Rascunho'
                        : active_aee.status}
                </Badge>
              </div>
            </div>
            <Button onClick={handleViewAEE} className="w-full" variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver AEE Completo
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">Nenhum AEE ativo encontrado</p>
            <Button onClick={handleCreateAEE} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo AEE
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

