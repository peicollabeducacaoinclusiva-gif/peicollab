import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  User,
  Calendar,
  Diff
} from 'lucide-react';
import { ResponsiveLayout, ResponsiveCard } from '@/components/shared/ResponsiveLayout';

interface PEIVersion {
  id: string;
  version_number: number;
  status: string;
  changed_by: string;
  changed_at: string;
  change_summary: string;
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
}

interface PEIVersionCompareProps {
  version1: PEIVersion;
  version2: PEIVersion;
  onClose?: () => void;
}

interface DiffItem {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  hasChanged: boolean;
}

export function PEIVersionCompare({ version1, version2, onClose }: PEIVersionCompareProps) {
  const [differences, setDifferences] = useState<DiffItem[]>([]);
  const [loading, setLoading] = useState(true);

  const compareVersions = () => {
    const diffs: DiffItem[] = [];

    // Comparar dados de diagnóstico
    if (version1.diagnosis_data || version2.diagnosis_data) {
      const diagnosis1 = version1.diagnosis_data || {};
      const diagnosis2 = version2.diagnosis_data || {};

      Object.keys({ ...diagnosis1, ...diagnosis2 }).forEach(key => {
        const oldValue = diagnosis1[key];
        const newValue = diagnosis2[key];
        const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

        if (hasChanged || oldValue !== undefined || newValue !== undefined) {
          diffs.push({
            field: `diagnosis.${key}`,
            label: `Diagnóstico - ${key}`,
            oldValue,
            newValue,
            hasChanged
          });
        }
      });
    }

    // Comparar dados de planejamento
    if (version1.planning_data || version2.planning_data) {
      const planning1 = version1.planning_data || {};
      const planning2 = version2.planning_data || {};

      Object.keys({ ...planning1, ...planning2 }).forEach(key => {
        const oldValue = planning1[key];
        const newValue = planning2[key];
        const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

        if (hasChanged || oldValue !== undefined || newValue !== undefined) {
          diffs.push({
            field: `planning.${key}`,
            label: `Planejamento - ${key}`,
            oldValue,
            newValue,
            hasChanged
          });
        }
      });
    }

    // Comparar dados de avaliação
    if (version1.evaluation_data || version2.evaluation_data) {
      const evaluation1 = version1.evaluation_data || {};
      const evaluation2 = version2.evaluation_data || {};

      Object.keys({ ...evaluation1, ...evaluation2 }).forEach(key => {
        const oldValue = evaluation1[key];
        const newValue = evaluation2[key];
        const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

        if (hasChanged || oldValue !== undefined || newValue !== undefined) {
          diffs.push({
            field: `evaluation.${key}`,
            label: `Avaliação - ${key}`,
            oldValue,
            newValue,
            hasChanged
          });
        }
      });
    }

    setDifferences(diffs);
    setLoading(false);
  };

  useEffect(() => {
    compareVersions();
  }, [version1, version2]);

  const renderValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Não definido</span>;
    }
    
    if (typeof value === 'object') {
      return <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    return <span>{String(value)}</span>;
  };

  const getChangeIcon = (hasChanged: boolean) => {
    if (hasChanged) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getChangeColor = (hasChanged: boolean) => {
    return hasChanged ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50';
  };

  if (loading) {
    return (
      <ResponsiveCard className="flex items-center justify-center h-32">
        <div className="text-center">
          <Diff className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Comparando versões...</p>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Diff className="h-6 w-6" />
              Comparação de Versões
            </h2>
            <p className="text-muted-foreground">
              Comparando v{version1.version_number} com v{version2.version_number}
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>

        {/* Informações das versões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResponsiveCard className={getChangeColor(false)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Versão {version1.version_number}
              </CardTitle>
              <CardDescription>
                {version1.change_summary || `Versão ${version1.version_number}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3 w-3" />
                {version1.changed_by}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                {new Date(version1.changed_at).toLocaleDateString('pt-BR')}
              </div>
              <Badge variant="outline">{version1.status}</Badge>
            </CardContent>
          </ResponsiveCard>

          <ResponsiveCard className={getChangeColor(false)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Versão {version2.version_number}
              </CardTitle>
              <CardDescription>
                {version2.change_summary || `Versão ${version2.version_number}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3 w-3" />
                {version2.changed_by}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                {new Date(version2.changed_at).toLocaleDateString('pt-BR')}
              </div>
              <Badge variant="outline">{version2.status}</Badge>
            </CardContent>
          </ResponsiveCard>
        </div>

        {/* Diferenças */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Diferenças Encontradas</h3>
          
          {differences.length === 0 ? (
            <ResponsiveCard className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">Nenhuma diferença encontrada</h3>
              <p className="text-muted-foreground">
                As versões são idênticas em todos os campos comparados.
              </p>
            </ResponsiveCard>
          ) : (
            <div className="space-y-4">
              {differences.map((diff, index) => (
                <ResponsiveCard key={index} className={getChangeColor(diff.hasChanged)}>
                  <div className="flex items-start gap-3">
                    {getChangeIcon(diff.hasChanged)}
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{diff.label}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">
                            Versão {version1.version_number}
                          </label>
                          <div className="p-3 bg-muted rounded border">
                            {renderValue(diff.oldValue)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">
                            Versão {version2.version_number}
                          </label>
                          <div className="p-3 bg-muted rounded border">
                            {renderValue(diff.newValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResponsiveCard>
              ))}
            </div>
          )}
        </div>

        {/* Resumo */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg">Resumo da Comparação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{differences.length}</div>
                <div className="text-sm text-muted-foreground">Total de Diferenças</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {differences.filter(d => !d.hasChanged).length}
                </div>
                <div className="text-sm text-muted-foreground">Campos Iguais</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {differences.filter(d => d.hasChanged).length}
                </div>
                <div className="text-sm text-muted-foreground">Campos Alterados</div>
              </div>
            </div>
          </CardContent>
        </ResponsiveCard>
      </div>
    </ResponsiveLayout>
  );
}