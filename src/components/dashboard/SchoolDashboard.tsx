// ============================================================================
// COMPONENTE: SchoolDashboard
// ============================================================================
// Dashboard integrado com widgets de PEI, Frequência e Desempenho
// Gestão Escolar - Fase 8
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  ClipboardList
} from 'lucide-react';

interface DashboardStats {
  // Alunos
  total_alunos: number;
  alunos_nee: number;
  alunos_pei_ativo: number;
  
  // Matrículas
  total_matriculas: number;
  matriculas_ativas: number;
  bolsistas: number;
  
  // Frequência
  taxa_presenca_geral: number;
  alunos_baixa_frequencia: number;
  
  // Desempenho
  media_geral_escola: number;
  aprovados_percentual: number;
  reprovados_percentual: number;
  
  // PEI
  peis_ativos: number;
  peis_pendentes: number;
  peis_aprovados: number;
}

interface SchoolDashboardProps {
  schoolId: string;
  tenantId: string;
}

export function SchoolDashboard({ schoolId, tenantId }: SchoolDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'mes' | 'bimestre' | 'ano'>('mes');

  useEffect(() => {
    loadDashboardStats();
  }, [schoolId, selectedPeriod]);

  const loadDashboardStats = async () => {
    try {
      // Carregar estatísticas em paralelo
      const [
        alunosData,
        matriculasData,
        frequenciaData,
        notasData,
        peisData,
      ] = await Promise.all([
        loadAlunosStats(),
        loadMatriculasStats(),
        loadFrequenciaStats(),
        loadNotasStats(),
        loadPEIsStats(),
      ]);

      setStats({
        ...alunosData,
        ...matriculasData,
        ...frequenciaData,
        ...notasData,
        ...peisData,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlunosStats = async () => {
    const { data: students } = await supabase
      .from('students')
      .select('id, necessidades_especiais')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    const total_alunos = students?.length || 0;
    const alunos_nee = students?.filter(s => s.necessidades_especiais).length || 0;

    // Alunos com PEI ativo
    const { count: alunos_pei_ativo } = await supabase
      .from('peis')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active_version', true);

    return { total_alunos, alunos_nee, alunos_pei_ativo: alunos_pei_ativo || 0 };
  };

  const loadMatriculasStats = async () => {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('status, bolsista')
      .eq('school_id', schoolId)
      .eq('ano_letivo', new Date().getFullYear().toString());

    const total_matriculas = enrollments?.length || 0;
    const matriculas_ativas = enrollments?.filter(e => e.status === 'Matriculado').length || 0;
    const bolsistas = enrollments?.filter(e => e.bolsista).length || 0;

    return { total_matriculas, matriculas_ativas, bolsistas };
  };

  const loadFrequenciaStats = async () => {
    const { data: attendance } = await supabase
      .from('attendance')
      .select('student_id, presenca')
      .gte('data', getStartDate(selectedPeriod));

    const total = attendance?.length || 0;
    const presencas = attendance?.filter(a => a.presenca).length || 0;
    const taxa_presenca_geral = total > 0 ? (presencas / total) * 100 : 0;

    // Alunos com < 75% de presença
    const studentAttendance = attendance?.reduce((acc: any, curr) => {
      if (!acc[curr.student_id]) {
        acc[curr.student_id] = { total: 0, presencas: 0 };
      }
      acc[curr.student_id].total++;
      if (curr.presenca) acc[curr.student_id].presencas++;
      return acc;
    }, {});

    const alunos_baixa_frequencia = Object.values(studentAttendance || {}).filter(
      (s: any) => (s.presencas / s.total) < 0.75
    ).length;

    return { taxa_presenca_geral, alunos_baixa_frequencia };
  };

  const loadNotasStats = async () => {
    const { data: grades } = await supabase
      .from('grades')
      .select('nota_valor, enrollment_id')
      .not('nota_valor', 'is', null);

    // Calcular média por aluno
    const alunoMedias = grades?.reduce((acc: any, grade) => {
      if (!acc[grade.enrollment_id]) {
        acc[grade.enrollment_id] = { soma: 0, count: 0 };
      }
      acc[grade.enrollment_id].soma += grade.nota_valor || 0;
      acc[grade.enrollment_id].count++;
      return acc;
    }, {});

    const medias = Object.values(alunoMedias || {}).map((a: any) => a.soma / a.count);
    const media_geral_escola = medias.length > 0
      ? medias.reduce((sum: number, m: number) => sum + m, 0) / medias.length
      : 0;

    const aprovados = medias.filter((m: number) => m >= 6).length;
    const reprovados = medias.filter((m: number) => m < 5).length;
    const total = medias.length || 1;

    const aprovados_percentual = (aprovados / total) * 100;
    const reprovados_percentual = (reprovados / total) * 100;

    return { media_geral_escola, aprovados_percentual, reprovados_percentual };
  };

  const loadPEIsStats = async () => {
    const { data: peis } = await supabase
      .from('peis')
      .select('status')
      .eq('school_id', schoolId);

    const peis_ativos = peis?.filter(p => p.status === 'approved').length || 0;
    const peis_pendentes = peis?.filter(p => p.status === 'pending').length || 0;
    const peis_aprovados = peis?.filter(p => p.status === 'approved').length || 0;

    return { peis_ativos, peis_pendentes, peis_aprovados };
  };

  const getStartDate = (period: 'mes' | 'bimestre' | 'ano'): string => {
    const now = new Date();
    switch (period) {
      case 'mes':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'bimestre':
        const bimestre = Math.floor(now.getMonth() / 2);
        return new Date(now.getFullYear(), bimestre * 2, 1).toISOString();
      case 'ano':
        return new Date(now.getFullYear(), 0, 1).toISOString();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">Sem dados disponíveis</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard da Escola</h2>
        
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'mes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('mes')}
          >
            Mês
          </Button>
          <Button
            variant={selectedPeriod === 'bimestre' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('bimestre')}
          >
            Bimestre
          </Button>
          <Button
            variant={selectedPeriod === 'ano' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('ano')}
          >
            Ano
          </Button>
        </div>
      </div>

      {/* Grid 1: Alunos e Matrículas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_alunos}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.alunos_nee} com NEE
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.matriculas_ativas}</div>
            <p className="text-xs text-gray-600 mt-1">
              de {stats.total_matriculas} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bolsistas</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.bolsistas}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.total_matriculas > 0 
                ? ((stats.bolsistas / stats.total_matriculas) * 100).toFixed(1) 
                : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PEIs Ativos</CardTitle>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.alunos_pei_ativo}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.peis_pendentes} pendente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid 2: Frequência e Desempenho */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats.taxa_presenca_geral.toFixed(1)}%
              </div>
              {stats.taxa_presenca_geral >= 90 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : stats.taxa_presenca_geral >= 75 ? (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            {stats.alunos_baixa_frequencia > 0 && (
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">
                  {stats.alunos_baixa_frequencia} aluno(s) com baixa frequência
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats.media_geral_escola.toFixed(1)}
              </div>
              {stats.media_geral_escola >= 7 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : stats.media_geral_escola >= 6 ? (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Desempenho acadêmico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.aprovados_percentual.toFixed(1)}%
            </div>
            <p className="text-xs text-red-600 mt-1">
              {stats.reprovados_percentual.toFixed(1)}% reprovados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid 3: Alertas e Ações */}
      <div className="grid grid-cols-2 gap-4">
        {/* Alertas de Frequência */}
        {stats.alunos_baixa_frequencia > 0 && (
          <Card className="border-l-4 border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Atenção: Baixa Frequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {stats.alunos_baixa_frequencia} aluno(s) com frequência abaixo de 75%.
                É necessário acompanhamento.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Ver Lista de Alunos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alertas de Desempenho */}
        {stats.reprovados_percentual > 20 && (
          <Card className="border-l-4 border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                Atenção: Desempenho Acadêmico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {stats.reprovados_percentual.toFixed(1)}% dos alunos estão com risco de reprovação.
                Considere ações de reforço.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Ver Alunos em Risco
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PEIs Pendentes */}
        {stats.peis_pendentes > 0 && (
          <Card className="border-l-4 border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardList className="h-5 w-5 text-yellow-600" />
                PEIs Pendentes de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {stats.peis_pendentes} PEI(s) aguardando aprovação da gestão.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Revisar PEIs
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alunos NEE sem PEI */}
        {stats.alunos_nee > stats.alunos_pei_ativo && (
          <Card className="border-l-4 border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-5 w-5 text-purple-600" />
                Alunos NEE sem PEI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {stats.alunos_nee - stats.alunos_pei_ativo} aluno(s) com necessidades
                especiais ainda não possuem PEI ativo.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Ver Alunos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grid 4: Comparativo PEI */}
      {stats.alunos_pei_ativo > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Acompanhamento PEI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {stats.peis_aprovados}
                </p>
                <p className="text-sm text-gray-600">Aprovados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.peis_pendentes}
                </p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.alunos_pei_ativo}
                </p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

