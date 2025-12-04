import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Download } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { mealService } from '../services/mealService';
import { toast } from 'sonner';
import { supabase } from '@pei/database';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [mealTypeData, setMealTypeData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalMeals: 0,
    totalCost: 0,
    attendanceRate: 0,
    averageDailyCost: 0,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadReports();
    }
  }, [userProfile, period]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            full_name,
            email,
            tenant_id,
            school_id,
            school:schools!profiles_school_id_fkey(school_name),
            tenant:tenants!profiles_tenant_id_fkey(id, network_name)
          `)
          .eq('id', user.id)
          .single();

        if (profileData) {
          setUserProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let startDate: Date;
      let endDate = today;

      switch (period) {
        case 'week':
          startDate = subDays(today, 7);
          break;
        case 'month':
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
          break;
        case 'quarter':
          startDate = subDays(today, 90);
          break;
        default:
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
      }

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Carregar dados de consumo
      const attendance = await mealService.getAttendance({
        tenantId: userProfile.tenant_id,
        schoolId: userProfile.school_id || undefined,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      // Carregar dados de compras
      const purchases = await mealService.getPurchases({
        tenantId: userProfile.tenant_id,
        schoolId: userProfile.school_id || undefined,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      // Processar dados de consumo por dia
      const attendanceByDate: Record<string, { consumed: number; total: number }> = {};
      attendance.forEach((a) => {
        const date = format(new Date(a.meal_date), 'dd/MM');
        if (!attendanceByDate[date]) {
          attendanceByDate[date] = { consumed: 0, total: 0 };
        }
        attendanceByDate[date].total++;
        if (a.consumed) {
          attendanceByDate[date].consumed++;
        }
      });

      const attendanceChartData = Object.entries(attendanceByDate)
        .map(([date, data]) => ({
          date,
          consumido: data.consumed,
          total: data.total,
          taxa: data.total > 0 ? Math.round((data.consumed / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Processar dados de custo por dia
      const costByDate: Record<string, number> = {};
      purchases.forEach((p) => {
        const date = format(new Date(p.purchase_date), 'dd/MM');
        costByDate[date] = (costByDate[date] || 0) + Number(p.total_amount || 0);
      });

      const costChartData = Object.entries(costByDate)
        .map(([date, cost]) => ({ date, custo: cost }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Processar dados por tipo de refeição
      const mealTypeCount: Record<string, number> = {};
      attendance.forEach((a) => {
        const type = MEAL_TYPE_LABELS[a.meal_type] || a.meal_type;
        mealTypeCount[type] = (mealTypeCount[type] || 0) + 1;
      });

      const mealTypeChartData = Object.entries(mealTypeCount).map(([name, value]) => ({
        name,
        value,
      }));

      // Calcular resumo
      const totalMeals = attendance.length;
      const consumedMeals = attendance.filter((a) => a.consumed).length;
      const totalCost = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

      setAttendanceData(attendanceChartData);
      setCostData(costChartData);
      setMealTypeData(mealTypeChartData);
      setSummary({
        totalMeals,
        totalCost,
        attendanceRate: totalMeals > 0 ? Math.round((consumedMeals / totalMeals) * 100) : 0,
        averageDailyCost: totalCost / days,
      });
    } catch (error: any) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: userProfile.tenant?.network_name,
    school_name: userProfile.school?.school_name,
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Merenda Escolar"
        appLogo="/logo.png"
        currentApp="merenda-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios e Análises</h1>
            <p className="text-muted-foreground mt-1">
              Análise de consumo, custos e desempenho
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'quarter')}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="week">Última Semana</option>
              <option value="month">Este Mês</option>
              <option value="quarter">Últimos 3 Meses</option>
            </select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Refeições
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : summary.totalMeals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Comparecimento
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : `${summary.attendanceRate}%`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Refeições consumidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custo Total
              </CardTitle>
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : `R$ ${summary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custo Médio Diário
              </CardTitle>
              <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : `R$ ${summary.averageDailyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média diária
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Consumo */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Comparecimento por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : attendanceData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Sem dados para exibir</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="taxa" stroke="#0088FE" name="Taxa (%)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Custos */}
          <Card>
            <CardHeader>
              <CardTitle>Custos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : costData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Sem dados para exibir</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="custo" fill="#00C49F" name="Custo (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Tipos de Refeição */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Refeição</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : mealTypeData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados para exibir</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mealTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mealTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

