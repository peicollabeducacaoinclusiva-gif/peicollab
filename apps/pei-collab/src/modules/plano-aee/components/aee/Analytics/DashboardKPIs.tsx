// ============================================================================
// COMPONENTE: DashboardKPIs
// ============================================================================
// Dashboard analítico com KPIs principais
// Data: 2025-01-09
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';;
import { Users, Calendar, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================================
// INTERFACE
// ============================================================================

interface DashboardStats {
  activeStudents: number;
  attendanceRate: number;
  attendanceTrend: 'up' | 'down' | 'stable';
  goalsAchieved: number;
  goalsTotal: number;
  activePlans: number;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function DashboardKPIs() {
  // Buscar estatísticas
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Buscar dados agregados
      const { data: plans } = await supabase
        .from('plano_aee')
        .select('*, aee_plan_goals(*), aee_attendance_records(attendance_status)')
        .eq('status', 'active');

      // Calcular estatísticas
      const activeStudents = new Set(plans?.map((p) => p.student_id)).size;
      const activePlans = plans?.length || 0;

      // Calcular frequência geral
      const allAttendances = plans?.flatMap((p: any) => p.aee_attendance_records || []) || [];
      const presentCount = allAttendances.filter(
        (a: any) => a.attendance_status === 'presente'
      ).length;
      const attendanceRate =
        allAttendances.length > 0 ? (presentCount / allAttendances.length) * 100 : 0;

      // Calcular metas
      const allGoals = plans?.flatMap((p: any) => p.aee_plan_goals || []) || [];
      const goalsTotal = allGoals.length;
      const goalsAchieved = allGoals.filter(
        (g: any) => g.progress_status === 'alcancada'
      ).length;

      // TODO: Calcular tendência comparando com mês anterior
      const attendanceTrend: 'up' | 'down' | 'stable' = 'stable';

      return {
        activeStudents,
        attendanceRate: Math.round(attendanceRate),
        attendanceTrend,
        goalsAchieved,
        goalsTotal,
        activePlans,
      } as DashboardStats;
    },
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading || !stats) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Alunos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Alunos Ativos
          </CardTitle>
          <Users className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{stats.activeStudents}</div>
          <p className="text-xs text-muted-foreground mt-1">Com planos ativos</p>
        </CardContent>
      </Card>

      {/* Taxa de Frequência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Frequência
          </CardTitle>
          <div className="flex items-center gap-2">
            {getTrendIcon(stats.attendanceTrend)}
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">Atendimentos realizados</p>
        </CardContent>
      </Card>

      {/* Metas Alcançadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Metas Alcançadas
          </CardTitle>
          <Target className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">{stats.goalsAchieved}</div>
          <p className="text-xs text-muted-foreground mt-1">
            de {stats.goalsTotal} metas totais
          </p>
        </CardContent>
      </Card>

      {/* Planos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Planos Ativos
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{stats.activePlans}</div>
          <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
        </CardContent>
      </Card>
    </div>
  );
}


