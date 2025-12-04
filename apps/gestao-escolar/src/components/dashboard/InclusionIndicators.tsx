import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Target, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { InclusionIndicators as InclusionIndicatorsType } from '@/services/inclusionIndicatorsService';
import { inclusionIndicatorsService } from '@/services/inclusionIndicatorsService';
import { toast } from 'sonner';

interface InclusionIndicatorsProps {
  tenantId?: string;
  schoolId?: string;
}

export function InclusionIndicators({ tenantId, schoolId }: InclusionIndicatorsProps) {
  const [indicators, setIndicators] = useState<InclusionIndicatorsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadIndicators();
  }, [tenantId, schoolId, startDate, endDate]);

  const loadIndicators = async () => {
    try {
      setLoading(true);
      const data = await inclusionIndicatorsService.calculateIndicators(
        tenantId,
        schoolId,
        startDate,
        endDate
      );
      setIndicators(data);
    } catch (error) {
      toast.error('Erro ao carregar indicadores');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Inclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!indicators) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicadores de Inclusão
            </CardTitle>
            <CardDescription>
              Evolução dos estudantes com PEI, frequência crítica e acompanhamento do AEE
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div>
              <Label className="text-xs">Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="pei">PEI</TabsTrigger>
            <TabsTrigger value="aee">AEE</TabsTrigger>
            <TabsTrigger value="attendance">Frequência</TabsTrigger>
            <TabsTrigger value="teachers">Professores</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Total de Estudantes</p>
                </div>
                <p className="text-3xl font-bold">{indicators.students.total}</p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Com PEI</p>
                </div>
                <p className="text-3xl font-bold">{indicators.students.with_pei}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {indicators.students.pei_coverage}% de cobertura
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Com AEE</p>
                </div>
                <p className="text-3xl font-bold">{indicators.students.with_aee}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {indicators.students.aee_coverage}% de cobertura
                </p>
              </div>
            </div>

            {/* Gráficos de Cobertura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Cobertura PEI</p>
                  <Badge variant="outline">{indicators.students.pei_coverage}%</Badge>
                </div>
                <Progress value={indicators.students.pei_coverage} className="h-2" />
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Cobertura AEE</p>
                  <Badge variant="outline">{indicators.students.aee_coverage}%</Badge>
                </div>
                <Progress value={indicators.students.aee_coverage} className="h-2" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pei" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Total de Metas</p>
                </div>
                <p className="text-2xl font-bold">{indicators.pei.total_goals}</p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Alcançadas</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {indicators.pei.goals_achieved}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium">Em Andamento</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {indicators.pei.goals_in_progress}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-medium">Não Iniciadas</p>
                </div>
                <p className="text-2xl font-bold text-gray-400">
                  {indicators.pei.goals_not_started}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Taxa de Conquista de Metas</p>
                <Badge variant="outline">{indicators.pei.achievement_rate}%</Badge>
              </div>
              <Progress value={indicators.pei.achievement_rate} className="h-2" />
            </div>
          </TabsContent>

          <TabsContent value="aee" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Total de Objetivos</p>
                </div>
                <p className="text-2xl font-bold">{indicators.aee.total_objectives}</p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Concluídos</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {indicators.aee.objectives_completed}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium">Ativos</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {indicators.aee.objectives_active}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Taxa de Conclusão AEE</p>
                <Badge variant="outline">{indicators.aee.completion_rate}%</Badge>
              </div>
              <Progress value={indicators.aee.completion_rate} className="h-2" />
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Taxa Média de Frequência</p>
                </div>
                <p className="text-3xl font-bold">{indicators.attendance.average_rate}%</p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium">Estudantes com Frequência Baixa</p>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {indicators.attendance.students_low_attendance}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ≥ 5 faltas nos últimos 30 dias
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Total de Professores</p>
                </div>
                <p className="text-2xl font-bold">{indicators.teachers.total_teachers}</p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Com PEI Atribuído</p>
                </div>
                <p className="text-2xl font-bold">{indicators.teachers.teachers_with_pei}</p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Professores AEE Ativos</p>
                </div>
                <p className="text-2xl font-bold">{indicators.teachers.aee_teachers_active}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

