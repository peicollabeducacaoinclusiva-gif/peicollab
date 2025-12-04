import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UnifiedStudentData } from '../../services/unifiedStudentService';

interface QuickPEIAccessProps {
  data: UnifiedStudentData;
  studentId: string;
}

export function QuickPEIAccess({ data, studentId }: QuickPEIAccessProps) {
  const navigate = useNavigate();
  const { active_pei } = data;

  const handleViewPEI = () => {
    if (active_pei) {
      // Navegar para o app PEI Collab com o ID do PEI
      window.open(`/pei/${active_pei.id}`, '_blank');
    }
  };

  const handleCreatePEI = () => {
    // Navegar para criar novo PEI com o studentId
    window.open(`/pei/new?studentId=${studentId}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PEI - Plano Educacional Individualizado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {active_pei ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status do PEI</p>
                <Badge
                  variant={
                    active_pei.status === 'approved'
                      ? 'default'
                      : active_pei.status === 'pending'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="mt-1"
                >
                  {active_pei.status === 'approved'
                    ? 'Aprovado'
                    : active_pei.status === 'pending'
                      ? 'Pendente'
                      : active_pei.status === 'draft'
                        ? 'Rascunho'
                        : active_pei.status}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Versão</p>
                <p className="text-base font-medium">v{active_pei.version_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Metas</p>
                <p className="text-base font-medium">{active_pei.goals_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Barreiras</p>
                <p className="text-base font-medium">{active_pei.barriers_count}</p>
              </div>
            </div>
            <Button onClick={handleViewPEI} className="w-full" variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver PEI Completo
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">Nenhum PEI ativo encontrado</p>
            <Button onClick={handleCreatePEI} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo PEI
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

