import { TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { IDEBIndicators } from '../services/governmentReportsService';

interface IDEBReportProps {
  data: IDEBIndicators;
}

export function IDEBReport({ data }: IDEBReportProps) {
  const isAboveTarget = data.ideb_score >= data.target_score;
  const progressPercentage = Math.min((data.ideb_score / data.target_score) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Indicadores IDEB - {data.school_name}</CardTitle>
          <Badge variant={isAboveTarget ? 'default' : 'destructive'}>
            {isAboveTarget ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {isAboveTarget ? 'Meta Atingida' : 'Abaixo da Meta'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Principal */}
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">IDEB {data.academic_year}</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                {data.ideb_score.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Pontuação Atual</p>
            </div>
            <div className="text-3xl text-muted-foreground">/</div>
            <div>
              <p className="text-4xl font-bold text-gray-600 dark:text-gray-400">
                {data.target_score.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Meta</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {progressPercentage.toFixed(1)}% da meta
            </p>
          </div>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                  <p className="text-2xl font-bold">{data.approval_rate.toFixed(1)}%</p>
                </div>
                {data.approval_rate >= 90 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média de Notas</p>
                  <p className="text-2xl font-bold">{data.average_grade.toFixed(2)}</p>
                </div>
                {data.average_grade >= 7 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Número de Alunos</p>
                <p className="text-2xl font-bold">{data.students_count}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Retenção</p>
                <p className="text-2xl font-bold">{data.retention_rate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparação com Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise de Desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">IDEB Atual</span>
                <span className="font-semibold">{data.ideb_score.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Meta IDEB</span>
                <span className="font-semibold">{data.target_score.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Diferença</span>
                <span className={`font-bold ${isAboveTarget ? 'text-green-600' : 'text-red-600'}`}>
                  {isAboveTarget ? '+' : ''}{(data.ideb_score - data.target_score).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}


