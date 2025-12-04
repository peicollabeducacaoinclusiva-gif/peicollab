import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCompare, ArrowLeftRight, CheckCircle, XCircle, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { peiVersioningService, VersionDiff } from '@/services/peiVersioningService';
import { usePEIVersioning } from '@/hooks/usePEIVersioning';
import { toast } from 'sonner';

interface PEIVersionDiffProps {
  peiId: string;
}

export function PEIVersionDiff({ peiId }: PEIVersionDiffProps) {
  const { versions, activeVersion } = usePEIVersioning(peiId);
  const [version1, setVersion1] = useState<number | null>(null);
  const [version2, setVersion2] = useState<number | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (versions.length > 0 && !version1) {
      setVersion1(versions[0]?.version_number || null);
    }
    if (versions.length > 1 && !version2) {
      setVersion2(versions[1]?.version_number || null);
    }
  }, [versions, version1, version2]);

  const handleCompare = async () => {
    if (!version1 || !version2) {
      toast.error('Selecione duas versões para comparar');
      return;
    }

    if (version1 === version2) {
      toast.error('Selecione versões diferentes');
      return;
    }

    setLoading(true);
    try {
      const diffData = await peiVersioningService.getVersionDiff(
        peiId,
        Math.min(version1, version2),
        Math.max(version1, version2)
      );
      setDiff(diffData);
    } catch (error) {
      toast.error('Erro ao comparar versões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderDiff = (field: string, v1: any, v2: any, changed: boolean) => {
    if (!changed) {
      return (
        <div className="p-2 bg-muted/30 rounded">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Minus className="h-4 w-4" />
            <span>Sem alterações em {field}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-900 dark:text-red-100">
              Versão {Math.min(version1 || 0, version2 || 0)} - {field}
            </span>
          </div>
          <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap">
            {JSON.stringify(v1, null, 2)}
          </pre>
        </div>
        <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Versão {Math.max(version1 || 0, version2 || 0)} - {field}
            </span>
          </div>
          <pre className="text-xs text-green-800 dark:text-green-200 whitespace-pre-wrap">
            {JSON.stringify(v2, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Comparar Versões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Versão 1</label>
              <Select
                value={version1?.toString() || ''}
                onValueChange={(value) => setVersion1(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma versão" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version_number} value={v.version_number.toString()}>
                      Versão {v.version_number}
                      {v.version_number === activeVersion?.version_number && (
                        <Badge variant="outline" className="ml-2">
                          Ativa
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Versão 2</label>
              <Select
                value={version2?.toString() || ''}
                onValueChange={(value) => setVersion2(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma versão" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version_number} value={v.version_number.toString()}>
                      Versão {v.version_number}
                      {v.version_number === activeVersion?.version_number && (
                        <Badge variant="outline" className="ml-2">
                          Ativa
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCompare} disabled={!version1 || !version2 || loading} className="w-full">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Comparar Versões
          </Button>

          {diff && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Diagnóstico</h3>
                  {renderDiff('diagnóstico', diff.version1.diagnosis, diff.version2.diagnosis, diff.diagnosis_changed)}
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Planejamento</h3>
                  {renderDiff('planejamento', diff.version1.planning, diff.version2.planning, diff.planning_changed)}
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Avaliação</h3>
                  {renderDiff('avaliação', diff.version1.evaluation, diff.version2.evaluation, diff.evaluation_changed)}
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  {diff.status_changed ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
                        <span className="text-sm text-red-900 dark:text-red-100">
                          {diff.version1.status}
                        </span>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                        <span className="text-sm text-green-900 dark:text-green-100">
                          {diff.version2.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Minus className="h-4 w-4" />
                        <span>Status não alterado: {diff.version1.status}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

