import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Users, GraduationCap, School, Upload, Download, UserCog, Shield, Building2, Network, FileText, BookOpen, TrendingUp, Award, Database, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import SimpleDashboard from '@/components/SimpleDashboard';
import { SuperadminDashboard, DirectorDashboard, CoordinatorDashboard, EducationSecretaryDashboard } from '@pei/dashboards';
import type { Profile } from '@pei/dashboards';
import { useUserProfile } from '../hooks/useUserProfile';

// URL do app PEI Collab (pode ser configurada via variável de ambiente)
const PEI_COLLAB_URL = import.meta.env.VITE_PEI_COLLAB_URL || 'http://localhost:8080';


export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    professionals: 0,
    classes: 0,
    peis: 0,
  });
  // Usar hook React Query para perfil
  const { data: profileData, isLoading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);

  // Converter profileData para UserProfile format
  const userProfile: AppUserProfile | null = profileData ? {
    id: profileData.tenant_id || '',
    full_name: profileData.full_name,
    email: profileData.email || '',
    role: profileData.role || 'teacher',
    tenant_id: profileData.tenant_id || null,
    network_name: (typeof profileData.tenant === 'object' && profileData.tenant !== null && 'network_name' in profileData.tenant) ? (profileData.tenant as any).network_name : undefined,
    school_name: (typeof profileData.school === 'object' && profileData.school !== null && 'school_name' in profileData.school) ? (profileData.school as any).school_name : undefined,
  } as AppUserProfile : null;

  useEffect(() => {
    if (userProfile) {
      loadStats();
    }
  }, [userProfile]);

  const loadStats = async () => {
    if (!userProfile?.tenant_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Buscar dados reais (RLS filtra automaticamente)
      const [studentsRes, professionalsRes, classesRes, peisRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('professionals').select('id', { count: 'exact' }),
        supabase.from('classes').select('id', { count: 'exact' }),
        supabase.from('peis').select('id', { count: 'exact' }),
      ]);

      setStats({
        students: studentsRes.count || 0,
        professionals: professionalsRes.count || 0,
        classes: classesRes.count || 0,
        peis: peisRes.count || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };



  const getRoleBadge = (role?: string) => {
    const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
      'superadmin': { label: 'Super Admin', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: Shield },
      'education_secretary': { label: 'Secretário de Educação', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: Network },
      'school_director': { label: 'Diretor', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', icon: Building2 },
      'coordinator': { label: 'Coordenador', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: Users },
      'aee_teacher': { label: 'Professor AEE', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800', icon: GraduationCap },
      'teacher': { label: 'Professor', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: GraduationCap },
      'support_professional': { label: 'Profissional de Apoio', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800', icon: Users },
      'specialist': { label: 'Especialista', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800', icon: Users },
      'family': { label: 'Família', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800', icon: Users },
    };

    const config = roleConfig[role || ''] || { label: role || 'Sem papel', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800', icon: Users };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border font-semibold px-3 py-1`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {config.label}
      </Badge>
    );
  };

  const getPermissionMessage = (role?: string) => {
    const messages: Record<string, string> = {
      'superadmin': 'Você tem acesso TOTAL a todos os dados de todas as redes municipais.',
      'education_secretary': 'Você visualiza todos os dados da sua rede municipal.',
      'school_director': 'Você visualiza todos os dados da sua escola.',
      'coordinator': 'Você visualiza dados da sua escola.',
      'aee_teacher': 'Você visualiza alunos da sua escola.',
      'teacher': 'Você visualiza apenas alunos com PEI vinculado a você.',
      'support_professional': 'Você visualiza apenas alunos que acompanha.',
      'specialist': 'Você visualiza dados da sua rede.',
      'family': 'Você visualiza apenas dados do seu filho.',
    };

    return messages[role || ''] || 'Suas permissões estão sendo carregadas...';
  };

  // Loading state considera profileLoading e stats loading
  const isLoading = profileLoading || loading;

  // Renderizar dashboard baseado no role do usuário
  const renderDashboard = () => {
    if (isLoading || !userProfile) {
      if (isLoading) {
        return (
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="text-center py-12" role="status" aria-live="polite">
              <p className="text-muted-foreground">Carregando dashboard...</p>
            </div>
          </main>
        );
      }
      return null;
    }

    console.log('[Dashboard] renderDashboard: userProfile:', {
      role: userProfile.role,
      tenant_id: userProfile.tenant_id,
      hasTenant: !!(profileData?.tenant),
    });

    // Preparar perfil para os dashboards compartilhados
    const profileForDashboard = {
      id: userProfile.id || userProfile.email || '',
      full_name: userProfile.full_name,
      email: userProfile.email || '',
      role: userProfile.role || 'teacher',
      school: profileData?.school as any,
      tenant: profileData?.tenant as any,
      tenant_id: userProfile.tenant_id || null,
      school_id: userProfile.school_id || null,
    } as Profile;

    console.log('[Dashboard] profileForDashboard criado:', {
      role: profileForDashboard.role,
      tenant_id: profileForDashboard.tenant_id,
      hasTenant: !!profileForDashboard.tenant,
    });

    // Renderizar dashboard apropriado por role
    switch (userProfile.role) {
      case 'superadmin':
        return <SuperadminDashboard profile={profileForDashboard as any} />;

      case 'education_secretary':
        return <EducationSecretaryDashboard profile={profileForDashboard as any} />;

      case 'school_director':
        return <DirectorDashboard profile={profileForDashboard as any} />;

      case 'coordinator':
        return <CoordinatorDashboard profile={profileForDashboard as any} />;

      default:
        // Dashboard simples para roles padrão
        return <SimpleDashboard stats={stats} loading={isLoading} />;
    }
  };

  // Mapear userProfile para formato do AppHeader
  const appUserProfile: AppUserProfile | undefined = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (profileData?.tenant as any)?.network_name,
    school_name: (profileData?.school as any)?.school_name,
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Gestão Escolar"
        appLogo="/logo.png"
        currentApp="gestao-escolar"
        userProfile={appUserProfile}
      />

      {/* Renderizar dashboard baseado no role */}
      {renderDashboard() || (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* User Welcome Card */}
          {userProfile && (
            <Card className="mb-6 border-0 shadow-xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white animate-fade-in">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <School className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold mb-1">
                          Olá, {userProfile.full_name.split(' ')[0]}! 👋
                        </CardTitle>
                        <CardDescription className="text-blue-100 text-base">
                          Bem-vindo ao Sistema de Gestão Escolar
                        </CardDescription>
                      </div>
                    </div>
                    {(profileData?.tenant as any)?.network_name && (
                      <div className="flex items-center gap-2 text-blue-100">
                        <Network className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {(profileData?.tenant as any).network_name}
                          {(profileData?.school as any)?.school_name && ` • ${(profileData?.school as any).school_name}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getRoleBadge(userProfile.role)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-blue-200 mb-1 uppercase tracking-wide">Email</p>
                    <p className="font-semibold text-white">{userProfile.email}</p>
                  </div>
                  {(profileData?.school as any)?.school_name && (
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <p className="text-xs text-blue-200 mb-1 uppercase tracking-wide">Escola</p>
                      <p className="font-semibold text-white flex items-center gap-2">
                        <School className="w-4 h-4" />
                        {(profileData?.school as any).school_name}
                      </p>
                    </div>
                  )}
                  {(profileData?.tenant as any)?.network_name && (
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <p className="text-xs text-blue-200 mb-1 uppercase tracking-wide">Rede</p>
                      <p className="font-semibold text-white flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        {(profileData?.tenant as any).network_name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-white/20">
                  <p className="text-sm text-blue-100 flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{getPermissionMessage(userProfile.role)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link to="/students">
              <Card className="stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Alunos
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md group-hover:scale-110 transition-transform">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                    ) : (
                      stats.students
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Estudantes cadastrados
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/professionals">
              <Card className="stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Profissionais
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                    ) : (
                      stats.professionals
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Equipe educacional
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/classes">
              <Card className="stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Turmas
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md group-hover:scale-110 transition-transform">
                    <School className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                    ) : (
                      stats.classes
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Classes ativas
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to={`${PEI_COLLAB_URL}/peis`} target="_blank" rel="noopener noreferrer">
              <Card className="stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    PEIs
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                    ) : (
                      stats.peis
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Planos Educacionais Individualizados
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Sistema de Avaliação e Acompanhamento */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Sistema de Avaliação e Acompanhamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/evaluations">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avaliações
                    </CardTitle>
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Sistema de Avaliação
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lançar notas, frequência e pareceres
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/student-history">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Histórico Escolar
                    </CardTitle>
                    <FileText className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Histórico do Aluno
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visualizar histórico completo
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/performance-tracking">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Desempenho
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Acompanhamento de Desempenho
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Indicadores e gráficos por turma
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Documentos Escolares */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Documentos e Relatórios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/certificates">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Certificados
                    </CardTitle>
                    <Award className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Certificados e Diplomas
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Emitir certificados, diplomas e declarações
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/reports">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-indigo-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Relatórios
                    </CardTitle>
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Relatórios Avançados
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mais de 20 relatórios pré-configurados
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/censo">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-cyan-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Censo Escolar
                    </CardTitle>
                    <FileText className="h-5 w-5 text-cyan-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Integração Educacenso
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exportação e validação para o Censo
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Gestão de Pessoal */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Gestão de Pessoal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/staff-management">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-teal-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Servidores
                    </CardTitle>
                    <Users className="h-5 w-5 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Gestão de Servidores
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Alocações, afastamentos e substituições
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Administração do Sistema */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Administração do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/users">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-indigo-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Usuários
                    </CardTitle>
                    <UserCog className="h-5 w-5 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Gerenciar Usuários
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hub central de cadastro de usuários
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/import">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Importação
                    </CardTitle>
                    <Upload className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Importar em Lote
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV, Excel, JSON - E-grafite
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/export">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-cyan-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Exportação
                    </CardTitle>
                    <Download className="h-5 w-5 text-cyan-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Exportar Dados
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Censo escolar, MEC, relatórios
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/backup">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Backup
                    </CardTitle>
                    <Database className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Gerenciamento de Backup
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Backup automático e restauração
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/audit">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Auditoria
                    </CardTitle>
                    <FileCheck className="h-5 w-5 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground">
                      Relatórios de Auditoria
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Logs de alterações e acesso
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/students"
                  className="p-4 border border-border rounded-lg hover:bg-accent transition"
                >
                  <h3 className="font-medium text-foreground">Cadastrar Aluno</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicionar novo estudante à rede
                  </p>
                </Link>

                <Link
                  to="/professionals"
                  className="p-4 border border-border rounded-lg hover:bg-accent transition"
                >
                  <h3 className="font-medium text-foreground">Cadastrar Profissional</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicionar novo colaborador
                  </p>
                </Link>

                <Link
                  to="/users"
                  className="p-4 border border-border rounded-lg hover:bg-accent transition"
                >
                  <h3 className="font-medium text-foreground">Cadastrar Usuário</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Criar novo usuário do sistema
                  </p>
                </Link>

                <Link
                  to="/import"
                  className="p-4 border border-border rounded-lg hover:bg-accent transition"
                >
                  <h3 className="font-medium text-foreground">Importar Dados</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Importar dados em lote de outros sistemas
                  </p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      )}
    </div>
  );
}

