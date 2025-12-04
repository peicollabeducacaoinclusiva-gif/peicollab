import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Download, Route, Bus } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { transportService } from '../services/transportService';
import { toast } from 'sonner';
import { supabase } from '@pei/database';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalRoutes: 0,
    totalVehicles: 0,
    totalStudents: 0,
    attendanceRate: 0,
    averageAttendance: 0,
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

      // Carregar rotas e veículos
      const routes = await transportService.getRoutes(userProfile.school_id, true);
      const vehicles = await transportService.getVehicles({
        schoolId: userProfile.school_id,
        tenantId: userProfile.tenant_id,
        activeOnly: true,
      });

      // Carregar vínculos
      const assignments = await transportService.getStudentAssignments({
        schoolId: userProfile.school_id,
        activeOnly: true,
      });

      // Carregar dados de presença
      const attendance = await transportService.getAttendance({
        startDate: startDateStr,
        endDate: endDateStr,
      });

      // Processar dados de presença por dia
      const attendanceByDate: Record<string, { present: number; total: number }> = {};
      attendance.forEach((a) => {
        const date = format(new Date(a.attendance_date), 'dd/MM');
        if (!attendanceByDate[date]) {
          attendanceByDate[date] = { present: 0, total: 0 };
        }
        attendanceByDate[date].total++;
        if (a.status === 'present') {
          attendanceByDate[date].present++;
        }
      });

      const attendanceChartData = Object.entries(attendanceByDate)
        .map(([date, data]) => ({
          date,
          presente: data.present,
          total: data.total,
          taxa: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Processar dados por rota
      const routeCount: Record<string, number> = {};
      attendance.forEach((a) => {
        const routeName = (a as any).route?.route_name || a.route_name || 'N/A';
        routeCount[routeName] = (routeCount[routeName] || 0) + 1;
      });

      const routeChartData = Object.entries(routeCount).map(([name, value]) => ({
        name,
        value,
      }));

      // Calcular resumo
      const totalAttendance = attendance.length;
      const presentAttendance = attendance.filter((a) => a.status === 'present').length;
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

      setAttendanceData(attendanceChartData);
      setRouteData(routeChartData);
      setSummary({
        totalRoutes: routes.length,
        totalVehicles: vehicles.length,
        totalStudents: assignments.length,
        attendanceRate: totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0,
        averageAttendance: totalAttendance / days,
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
        appName="Transporte Escolar"
        appLogo="/logo.png"
        currentApp="transporte-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios e Análises</h1>
            <p className="text-muted-foreground mt-1">
              Análise de rotas, veículos e presença
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rotas Ativas
              </CardTitle>
              <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : summary.totalRoutes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Veículos
              </CardTitle>
              <Bus className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : summary.totalVehicles}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alunos Transportados
              </CardTitle>
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : summary.totalStudents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Presença
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : `${summary.attendanceRate}%`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Diária
              </CardTitle>
              <Calendar className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : Math.round(summary.averageAttendance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Presença */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Presença por Dia</CardTitle>
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

          {/* Gráfico de Rotas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Rota</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : routeData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Sem dados para exibir</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={routeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {routeData.map((entry, index) => (
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
    </div>
  );
}

