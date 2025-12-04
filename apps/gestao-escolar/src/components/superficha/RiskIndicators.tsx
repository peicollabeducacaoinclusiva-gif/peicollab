import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, Users, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RiskIndicators as RiskIndicatorsType } from '../../services/superfichaService';
import { cn } from '@/lib/utils';

interface RiskIndicatorsProps {
  risks: RiskIndicatorsType;
  className?: string;
}

export function RiskIndicators({ risks, className }: RiskIndicatorsProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertCircle className="h-5 w-5" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />;
      case 'low':
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Indicadores de Risco
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Risco Geral */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2">
              {getRiskIcon(risks.overall_risk)}
              <span className="font-medium">Risco Geral</span>
            </div>
            <Badge className={getRiskColor(risks.overall_risk)}>
              {risks.overall_risk === 'high' && 'Alto'}
              {risks.overall_risk === 'medium' && 'Médio'}
              {risks.overall_risk === 'low' && 'Baixo'}
            </Badge>
          </div>

          {/* Risco de Frequência */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Frequência
              </div>
              <Badge variant="outline" className={getRiskColor(risks.frequency_risk.level)}>
                {risks.frequency_risk.level === 'high' && 'Alto'}
                {risks.frequency_risk.level === 'medium' && 'Médio'}
                {risks.frequency_risk.level === 'low' && 'Baixo'}
                {risks.frequency_risk.level === 'unknown' && 'Indefinido'}
              </Badge>
            </div>
            {risks.frequency_risk.percentage !== undefined && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Taxa de faltas:</span>
                  <span className="font-medium">{risks.frequency_risk.percentage.toFixed(1)}%</span>
                </div>
                {risks.frequency_risk.total_absences !== undefined && (
                  <div className="flex justify-between">
                    <span>Total de faltas:</span>
                    <span>{risks.frequency_risk.total_absences} / {risks.frequency_risk.total_classes || 0}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Risco de Notas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Desempenho Acadêmico
              </div>
              <Badge variant="outline" className={getRiskColor(risks.grade_risk.level)}>
                {risks.grade_risk.level === 'high' && 'Alto'}
                {risks.grade_risk.level === 'medium' && 'Médio'}
                {risks.grade_risk.level === 'low' && 'Baixo'}
                {risks.grade_risk.level === 'unknown' && 'Indefinido'}
              </Badge>
            </div>
            {risks.grade_risk.average_grade !== undefined && (
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Média de notas:</span>
                  <span className="font-medium">{risks.grade_risk.average_grade.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Risco de Inclusão */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Inclusão
              </div>
              <Badge variant="outline" className={getRiskColor(risks.inclusion_risk.level)}>
                {risks.inclusion_risk.level === 'high' && 'Alto'}
                {risks.inclusion_risk.level === 'medium' && 'Médio'}
                {risks.inclusion_risk.level === 'low' && 'Baixo'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>PEI Ativo:</span>
                <span>{risks.inclusion_risk.has_active_pei ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex justify-between">
                <span>AEE Ativo:</span>
                <span>{risks.inclusion_risk.has_active_aee ? 'Sim' : 'Não'}</span>
              </div>
              {risks.inclusion_risk.pei_status && (
                <div className="flex justify-between">
                  <span>Status PEI:</span>
                  <span className="capitalize">{risks.inclusion_risk.pei_status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

