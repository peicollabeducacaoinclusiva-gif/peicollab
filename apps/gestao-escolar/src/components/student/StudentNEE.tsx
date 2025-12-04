import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { StudentNEE } from '../../services/unifiedStudentService';

interface StudentNEEProps {
  nee: StudentNEE;
}

export function StudentNEE({ nee }: StudentNEEProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Necessidades Educacionais Especiais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {nee.necessidades_especiais ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Estudante com Necessidades Educacionais Especiais</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-gray-400" />
                <span className="text-muted-foreground">Sem necessidades especiais registradas</span>
              </>
            )}
          </div>

          {nee.tipo_necessidade && nee.tipo_necessidade.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Tipos de Necessidade:
              </label>
              <div className="flex flex-wrap gap-2">
                {nee.tipo_necessidade.map((tipo, index) => (
                  <Badge key={index} variant="default" className="bg-purple-600">
                    {tipo}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {nee.pei && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium">PEI Ativo</span>
                <Badge variant="outline">{nee.pei.status}</Badge>
              </div>
              {nee.pei.barriers && nee.pei.barriers.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Barreiras Identificadas:
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {nee.pei.barriers.map((barrier) => (
                      <li key={barrier.id} className="text-sm">
                        <span className="font-medium">{barrier.barrier_type}:</span>{' '}
                        {barrier.description}
                        {barrier.severity && (
                          <Badge variant="outline" className="ml-2">
                            {barrier.severity}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {nee.aee && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Plano AEE Ativo</span>
                <Badge variant="outline">{nee.aee.status}</Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

