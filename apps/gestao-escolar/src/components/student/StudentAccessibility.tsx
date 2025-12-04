import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { StudentAccessibility as StudentAccessibilityType } from '../../services/unifiedStudentService';

interface StudentAccessibilityProps {
  accessibility: StudentAccessibilityType;
}

export function StudentAccessibility({ accessibility }: StudentAccessibilityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Indicadores de Acessibilidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {accessibility.has_pei ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">PEI Ativo</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Sem PEI</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {accessibility.has_aee ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">AEE Ativo</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Sem AEE</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {accessibility.has_adaptations ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Com Adaptações</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Sem Adaptações</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {accessibility.needs_special_attention ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm">Atenção Especial</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Atenção Regular</span>
                </>
              )}
            </div>
          </div>

          {accessibility.adaptations && accessibility.adaptations.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Adaptações Registradas:
              </label>
              <div className="space-y-2">
                {accessibility.adaptations.map((adaptation) => (
                  <div
                    key={adaptation.id}
                    className="p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{adaptation.type}</Badge>
                    </div>
                    <p className="text-sm">{adaptation.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

