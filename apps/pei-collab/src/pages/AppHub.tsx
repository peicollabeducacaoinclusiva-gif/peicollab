import { Link } from 'react-router-dom';
import { useTenant } from '@pei/auth';
import { 
  GraduationCap, 
  School, 
  Accessibility, 
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface AppCard {
  id: string;
  name: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  roles: string[];
}

export default function AppHub() {
  const { tenant, tenantId } = useTenant();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/auth');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .eq('id', authUser.id)
        .single();

      setUser(authUser);
      setProfile(profileData);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const apps: AppCard[] = [
    {
      id: 'pei',
      name: 'PEI Collab',
      description: 'Planos Educacionais Individualizados',
      icon: GraduationCap,
      path: '/dashboard',
      color: 'bg-blue-500',
      roles: ['teacher', 'coordinator', 'aee_teacher', 'support_professional', 'school_manager']
    },
    {
      id: 'gestao',
      name: 'Gestão Escolar',
      description: 'Cadastros, Gerenciamento e Módulos Integrados',
      icon: School,
      path: (import.meta.env.VITE_GESTAO_ESCOLAR_URL || 'http://localhost:5174') + '/dashboard',
      color: 'bg-green-500',
      roles: ['coordinator', 'school_manager', 'education_secretary']
    },
    {
      id: 'aee',
      name: 'Plano de AEE',
      description: 'Atendimento Educacional Especializado',
      icon: Accessibility,
      path: '/plano-aee',
      color: 'bg-purple-500',
      roles: ['aee_teacher', 'coordinator']
    }
  ];

  const userRoles = profile?.user_roles?.map((ur: any) => ur.role) || [];
  
  const availableApps = apps.filter(app => 
    app.roles.includes('all') || 
    app.roles.some(role => userRoles.includes(role))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {tenant?.customization?.logo_url ? (
                <img 
                  src={tenant.customization.logo_url} 
                  alt="Logo" 
                  className="h-12"
                />
              ) : (
                <GraduationCap className="h-12 w-12 text-blue-600" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {tenant?.name || 'PEI Collab'}
                </h1>
                {tenant?.customization?.institution_name && (
                  <p className="text-sm text-gray-500">
                    {tenant.customization.institution_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {userRoles.join(', ')}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {profile?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Selecione um aplicativo para começar
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableApps.map((app) => {
            const AppIcon = app.icon;
            const isExternal = app.path.startsWith('http');
            
            return isExternal ? (
              <a
                key={app.id}
                href={app.path}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full">
                  <CardHeader>
                    <div className={`${app.color} w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                      <AppIcon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-center text-xl">
                      {app.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 text-center">
                      {app.description}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ) : (
              <Link key={app.id} to={app.path}>
                <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full">
                  <CardHeader>
                    <div className={`${app.color} w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                      <AppIcon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-center text-xl">
                      {app.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 text-center">
                      {app.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-sm text-blue-900">
              💡 <strong>Dica:</strong> Você pode navegar entre os aplicativos usando o menu
              superior em cada app. Seus dados estão sincronizados automaticamente.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

