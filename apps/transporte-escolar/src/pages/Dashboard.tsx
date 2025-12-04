import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Bus, Route, Users, MapPin, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@pei/ui';
import { transportService } from '../services/transportService';
import { format } from 'date-fns';

export default function TransportDashboard() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadData();
    }
  }, [userProfile]);

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

  async function loadData() {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      // Carregar rotas e veículos
      const routesData = await transportService.getRoutes(userProfile.school_id, true);
      const vehiclesData = await transportService.getVehicles({
        schoolId: userProfile.school_id,
        tenantId: userProfile.tenant_id,
        activeOnly: true,
      });

      // Carregar vínculos
      const assignmentsData = await transportService.getStudentAssignments({
        schoolId: userProfile.school_id,
        activeOnly: true,
      });

      // Carregar presenças de hoje
      const attendanceData = await transportService.getAttendance({
        startDate: today,
        endDate: today,
      });

      setRoutes(routesData);
      setVehicles(vehiclesData);
      setAssignments(assignmentsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalStops = routes.reduce((sum, route) => sum + (route.stops?.length || 0), 0);
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-cyan-50/30 dark:to-cyan-950/10">
      <AppHeader
        appName="Transporte Escolar"
        appLogo="/logo.png"
        currentApp="transporte-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bus className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">🚌 Transporte Escolar</h1>
                  <p className="text-cyan-100">Gerencie rotas, veículos e acompanhe o transporte dos alunos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { 
              title: 'Rotas Ativas', 
              value: loading ? '...' : routes.length, 
              subtitle: 'Rotas cadastradas',
              icon: Route, 
              gradient: 'from-blue-500 to-cyan-500', 
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
              index: 0
            },
            { 
              title: 'Veículos', 
              value: loading ? '...' : vehicles.length, 
              subtitle: 'Veículos ativos',
              icon: Bus, 
              gradient: 'from-green-500 to-emerald-500', 
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
              index: 1
            },
            { 
              title: 'Alunos Transportados', 
              value: loading ? '...' : assignments.length, 
              subtitle: 'Alunos vinculados',
              icon: Users, 
              gradient: 'from-purple-500 to-pink-500', 
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
              index: 2
            },
            { 
              title: 'Taxa de Presença Hoje', 
              value: loading ? '...' : `${attendanceRate}%`, 
              subtitle: `${presentCount} de ${attendance.length} registros`,
              icon: TrendingUp, 
              gradient: 'from-orange-500 to-amber-500', 
              bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
              index: 3
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${stat.bgGradient} animate-fade-in`}
                style={{ animationDelay: `${stat.index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cards de Ação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link to="/vehicles">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Veículos</CardTitle>
                  <Bus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gerenciar frota de veículos escolares
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/routes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Rotas</CardTitle>
                  <Route className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Criar e gerenciar rotas de transporte
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/students">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Vínculos</CardTitle>
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Vincular alunos às rotas
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/attendance">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Controle de Acesso</CardTitle>
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registrar acesso ao transporte
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Relatórios</CardTitle>
                  <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Relatórios e análises
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total de Paradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold text-foreground">
                  {loading ? '...' : totalStops}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paradas em todas as rotas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acessos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : attendance.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registros de acesso hoje
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

