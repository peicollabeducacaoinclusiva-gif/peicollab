import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@pei/database';
import { 
  UtensilsCrossed, 
  Calendar, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  Package,
  ChefHat,
  FileText,
  BarChart3
} from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';

interface MealStats {
  activeMenus: number;
  totalPlans: number;
  mealsServedToday: number;
  totalSuppliers: number;
  totalStudents: number;
  monthlyCost: number;
  attendanceRate: number;
  wastePercentage: number;
}

export default function MealDashboard() {
  const [stats, setStats] = useState<MealStats>({
    activeMenus: 0,
    totalPlans: 0,
    mealsServedToday: 0,
    totalSuppliers: 0,
    totalStudents: 0,
    monthlyCost: 0,
    attendanceRate: 0,
    wastePercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
    loadStats();
  }, []);

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
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .limit(1);

          setUserProfile({
            ...profileData,
            role: userRoles?.[0]?.role || 'teacher',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const tenantId = profile.tenant_id;
      const schoolId = profile.school_id;

      // Buscar cardápios ativos
      const today = new Date();
      const { count: activeMenusCount } = await supabase
        .from('meal_menus')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lte('period_start', today.toISOString().split('T')[0])
        .gte('period_end', today.toISOString().split('T')[0]);

      // Buscar planejamentos
      const { count: plansCount } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Buscar refeições servidas hoje
      const { count: mealsTodayCount } = await supabase
        .from('student_meal_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('meal_date', today.toISOString().split('T')[0])
        .eq('consumed', true);

      // Buscar fornecedores
      const { count: suppliersCount } = await supabase
        .from('meal_suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Buscar total de alunos
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Calcular custo mensal (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: purchases } = await supabase
        .from('meal_purchases')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .gte('purchase_date', thirtyDaysAgo.toISOString().split('T')[0]);

      const monthlyCost = purchases?.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0) || 0;

      // Calcular taxa de comparecimento (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: attendance } = await supabase
        .from('student_meal_attendance')
        .select('consumed')
        .eq('tenant_id', tenantId)
        .gte('meal_date', sevenDaysAgo.toISOString().split('T')[0]);

      const totalMeals = attendance?.length || 0;
      const consumedMeals = attendance?.filter(a => a.consumed).length || 0;
      const attendanceRate = totalMeals > 0 ? Math.round((consumedMeals / totalMeals) * 100) : 0;

      setStats({
        activeMenus: activeMenusCount || 0,
        totalPlans: plansCount || 0,
        mealsServedToday: mealsTodayCount || 0,
        totalSuppliers: suppliersCount || 0,
        totalStudents: studentsCount || 0,
        monthlyCost,
        attendanceRate,
        wastePercentage: 100 - attendanceRate,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
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
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <UtensilsCrossed className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">🍽️ Merenda Escolar</h1>
                  <p className="text-green-100">Gerencie cardápios, compras e consumo de refeições</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { 
              title: 'Cardápios Ativos', 
              value: loading ? '...' : stats.activeMenus, 
              subtitle: 'Período atual',
              icon: Calendar, 
              gradient: 'from-blue-500 to-cyan-500', 
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20' 
            },
            { 
              title: 'Refeições Hoje', 
              value: loading ? '...' : stats.mealsServedToday, 
              subtitle: 'Servidas hoje',
              icon: Users, 
              gradient: 'from-green-500 to-emerald-500', 
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20' 
            },
            { 
              title: 'Custo Mensal', 
              value: loading ? '...' : `R$ ${stats.monthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
              subtitle: 'Últimos 30 dias',
              icon: DollarSign, 
              gradient: 'from-purple-500 to-pink-500', 
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20' 
            },
            { 
              title: 'Taxa de Comparecimento', 
              value: loading ? '...' : `${stats.attendanceRate}%`, 
              subtitle: 'Últimos 7 dias',
              icon: TrendingUp, 
              gradient: 'from-orange-500 to-amber-500', 
              bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20' 
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${stat.bgGradient} animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
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
          <Link to="/menus">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Cardápios</CardTitle>
                  <ChefHat className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardDescription>
                  Gerenciar cardápios semanais e mensais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Criar, editar e visualizar cardápios por período
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/planning">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Planejamento</CardTitle>
                  <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardDescription>
                  Planejar compras e estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Calcular necessidades e planejar compras
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/suppliers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Fornecedores</CardTitle>
                  <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardDescription>
                  Gerenciar fornecedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cadastrar e gerenciar fornecedores de alimentos
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/attendance">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Controle de Consumo</CardTitle>
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardDescription>
                  Registrar consumo de refeições
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registrar e acompanhar consumo diário
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/purchases">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Compras</CardTitle>
                  <ShoppingCart className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <CardDescription>
                  Registrar compras realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Histórico e controle de compras
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
                <CardDescription>
                  Relatórios e análises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Consumo, custos, desperdício e mais
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alunos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de alunos na rede
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fornecedores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.totalSuppliers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fornecedores cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planejamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.totalPlans}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Planejamentos de compras
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
