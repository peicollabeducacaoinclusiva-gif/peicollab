import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  School, 
  Users, 
  Calendar,
  FileText,
  BookOpen,
  Bus,
  UtensilsCrossed,
  UserCircle,
  LogOut,
  Star,
  Clock,
  TrendingUp,
  Filter,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { useFavorites } from '@/hooks/useFavorites';
import { useAppHistory } from '@/hooks/useAppHistory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface App {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  url: string;
  port: number;
}

type FilterType = 'all' | 'favorites' | 'recent' | 'most-used';

export default function AppSelector() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { hasAccessToApp, loading: permissionsLoading } = useAppPermissions(user?.id);
  const { favorites, toggleFavorite, isFavorite } = useFavorites(user?.id);
  const { history, addToHistory, getMostUsedApps, getRecentApps } = useAppHistory(user?.id);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    // Aguardar o carregamento da autenticação antes de redirecionar
    if (!authLoading && !isAuthenticated) {
      console.log('❌ Usuário não autenticado, redirecionando para /login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const allApps: App[] = [
    {
      id: 'pei-collab',
      name: 'PEI Collab',
      description: 'Planos Educacionais Individualizados',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      url: import.meta.env.VITE_PEI_COLLAB_URL || 'https://peicollab.com.br',
      port: 8080,
    },
    {
      id: 'gestao-escolar',
      name: 'Gestão Escolar',
      description: 'Administração Completa da Escola',
      icon: School,
      color: 'from-green-500 to-green-600',
      url: import.meta.env.VITE_GESTAO_ESCOLAR_URL || 'http://localhost:5174',
      port: 5174,
    },
    {
      id: 'plano-aee',
      name: 'Plano de AEE',
      description: 'Atendimento Educacional Especializado',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      url: import.meta.env.VITE_PLANO_AEE_URL || 'http://localhost:5175',
      port: 5175,
    },
    {
      id: 'planejamento',
      name: 'Planejamento',
      description: 'Planejamento Pedagógico',
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
      url: import.meta.env.VITE_PLANEJAMENTO_URL || 'http://localhost:5176',
      port: 5176,
    },
    {
      id: 'blog',
      name: 'Blog Educacional',
      description: 'Conteúdo sobre Educação Inclusiva',
      icon: BookOpen,
      color: 'from-cyan-500 to-cyan-600',
      url: import.meta.env.VITE_BLOG_URL || 'http://localhost:5177',
      port: 5177,
    },
    {
      id: 'atividades',
      name: 'Atividades',
      description: 'Banco de Atividades Pedagógicas',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      url: import.meta.env.VITE_ATIVIDADES_URL || 'http://localhost:5178',
      port: 5178,
    },
    {
      id: 'portal-responsavel',
      name: 'Portal do Responsável',
      description: 'Acesso para Famílias',
      icon: UserCircle,
      color: 'from-pink-500 to-pink-600',
      url: import.meta.env.VITE_PORTAL_RESPONSAVEL_URL || 'http://localhost:5180',
      port: 5180,
    },
    {
      id: 'transporte-escolar',
      name: 'Transporte Escolar',
      description: 'Gestão de Transporte e Rotas',
      icon: Bus,
      color: 'from-teal-500 to-teal-600',
      url: import.meta.env.VITE_TRANSPORTE_URL || 'http://localhost:5181',
      port: 5181,
    },
    {
      id: 'merenda-escolar',
      name: 'Merenda Escolar',
      description: 'Gestão de Alimentação Escolar',
      icon: UtensilsCrossed,
      color: 'from-amber-500 to-amber-600',
      url: import.meta.env.VITE_MERENDA_URL || 'http://localhost:5182',
      port: 5182,
    },
  ];

  // Filtrar apps por permissões
  const accessibleApps = useMemo(() => {
    return allApps.filter(app => hasAccessToApp(app.id as any));
  }, [hasAccessToApp]);

  // Filtrar apps conforme filtro selecionado
  const filteredApps = useMemo(() => {
    if (filter === 'all') {
      return accessibleApps;
    }
    
    if (filter === 'favorites') {
      return accessibleApps.filter(app => isFavorite(app.id));
    }
    
    if (filter === 'recent') {
      const recentIds = getRecentApps(10).map(item => item.appId);
      return accessibleApps.filter(app => recentIds.includes(app.id));
    }
    
    if (filter === 'most-used') {
      const mostUsedIds = getMostUsedApps(10).map(item => item.appId);
      return accessibleApps.filter(app => mostUsedIds.includes(app.id));
    }
    
    return accessibleApps;
  }, [filter, accessibleApps, isFavorite, getRecentApps, getMostUsedApps]);

  // Ordenar: favoritos primeiro, depois por histórico
  const sortedApps = useMemo(() => {
    const favoriteApps = filteredApps.filter(app => isFavorite(app.id));
    const otherApps = filteredApps.filter(app => !isFavorite(app.id));
    
    // Ordenar outros apps por frequência de uso
    const mostUsedIds = getMostUsedApps().map(item => item.appId);
    const sortedOther = otherApps.sort((a, b) => {
      const aIndex = mostUsedIds.indexOf(a.id);
      const bIndex = mostUsedIds.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    
    return [...favoriteApps, ...sortedOther];
  }, [filteredApps, isFavorite, getMostUsedApps]);

  // Mapeamento de rotas de dashboard para cada app
  const getAppDashboardRoute = (appId: string): string => {
    const dashboardRoutes: Record<string, string> = {
      'pei-collab': '/dashboard',
      'gestao-escolar': '/',
      'plano-aee': '/',
      'planejamento': '/dashboard',
      'blog': '/',
      'atividades': '/',
      'portal-responsavel': '/',
      'transporte-escolar': '/',
      'merenda-escolar': '/',
    };
    return dashboardRoutes[appId] || '/';
  };

  const handleAppClick = async (app: App) => {
    try {
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
        return;
      }

      // Adicionar ao histórico
      addToHistory(app.id, app.name);

      // Obter rota do dashboard do app
      const dashboardRoute = getAppDashboardRoute(app.id);
      
      // Criar URL do dashboard com SSO
      const baseUrl = app.url.replace(/\/$/, ''); // Remove barra final se existir
      const dashboardUrl = `${baseUrl}${dashboardRoute}`;
      
      // Garantir que a sessão SSO está salva antes de redirecionar
      try {
        const { ssoManager } = await import('@pei/auth');
        await ssoManager.saveSession(session, 'landing');
        console.log('✅ Sessão SSO salva antes de redirecionar para', app.name);
      } catch (ssoError) {
        console.warn('⚠️ Erro ao salvar sessão SSO:', ssoError);
        // Continuar mesmo se houver erro no SSO
      }
      
      // Abrir em nova aba para manter a landing page aberta
      window.open(dashboardUrl, '_blank');
      
      toast.success(`Redirecionando para ${app.name}...`);
    } catch (error) {
      console.error('Erro ao acessar app:', error);
      toast.error('Erro ao acessar o aplicativo. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    toggleFavorite(appId);
    toast.success(isFavorite(appId) ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
  };

  if (!isAuthenticated || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const mostUsedApps = getMostUsedApps(3);
  const recentApps = getRecentApps(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PEI Collab
              </span>
              <p className="text-xs text-gray-500">Selecione um aplicativo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCircle className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Bem-vindo ao PEI Collab
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Escolha um dos aplicativos abaixo para começar. Todos os apps estão integrados e compartilham a mesma autenticação.
          </motion.p>
        </div>

        {/* Quick Access Sections */}
        {(mostUsedApps.length > 0 || recentApps.length > 0 || favorites.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 space-y-6"
          >
            {favorites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Favoritos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {accessibleApps
                    .filter(app => isFavorite(app.id))
                    .slice(0, 3)
                    .map((app, index) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        index={index}
                        isFavorite={isFavorite(app.id)}
                        onFavoriteClick={handleFavoriteClick}
                        onAppClick={handleAppClick}
                      />
                    ))}
                </div>
              </div>
            )}

            {mostUsedApps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Mais Usados</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mostUsedApps.map((historyItem, index) => {
                    const app = accessibleApps.find(a => a.id === historyItem.appId);
                    if (!app) return null;
                    return (
                      <AppCard
                        key={app.id}
                        app={app}
                        index={index}
                        isFavorite={isFavorite(app.id)}
                        onFavoriteClick={handleFavoriteClick}
                        onAppClick={handleAppClick}
                        accessCount={historyItem.accessCount}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {recentApps.length > 0 && mostUsedApps.length === 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Acessados Recentemente</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentApps.map((historyItem, index) => {
                    const app = accessibleApps.find(a => a.id === historyItem.appId);
                    if (!app) return null;
                    return (
                      <AppCard
                        key={app.id}
                        app={app}
                        index={index}
                        isFavorite={isFavorite(app.id)}
                        onFavoriteClick={handleFavoriteClick}
                        onAppClick={handleAppClick}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 flex flex-wrap gap-2 items-center"
        >
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          {(['all', 'favorites', 'recent', 'most-used'] as FilterType[]).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="text-xs"
            >
              {filterType === 'all' && 'Todos'}
              {filterType === 'favorites' && 'Favoritos'}
              {filterType === 'recent' && 'Recentes'}
              {filterType === 'most-used' && 'Mais Usados'}
              {filter !== 'all' && filter === filterType && (
                <X className="ml-2 h-3 w-3" onClick={(e) => {
                  e.stopPropagation();
                  setFilter('all');
                }} />
              )}
            </Button>
          ))}
          {filter !== 'all' && (
            <Badge variant="secondary" className="ml-2">
              {sortedApps.length} app{sortedApps.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </motion.div>

        {/* Apps Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedApps.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Nenhum aplicativo encontrado com este filtro.</p>
              </div>
            ) : (
              sortedApps.map((app, index) => (
                <AppCard
                  key={app.id}
                  app={app}
                  index={index}
                  isFavorite={isFavorite(app.id)}
                  onFavoriteClick={handleFavoriteClick}
                  onAppClick={handleAppClick}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* Info Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            💡 Dica
          </h3>
          <p className="text-gray-700">
            Você pode manter múltiplos aplicativos abertos ao mesmo tempo. Todos compartilham a mesma sessão de autenticação, 
            então você não precisará fazer login novamente em cada app. Use a estrela para marcar seus apps favoritos!
          </p>
        </motion.div>
      </main>
    </div>
  );
}

// Componente de Card do App com animações
interface AppCardProps {
  app: App;
  index: number;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent, appId: string) => void;
  onAppClick: (app: App) => void;
  accessCount?: number;
}

function AppCard({ app, index, isFavorite, onFavoriteClick, onAppClick, accessCount }: AppCardProps) {
  const Icon = app.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-300 cursor-pointer group relative overflow-hidden"
        onClick={() => onAppClick(app)}
      >
        {/* Badge de acesso frequente */}
        {accessCount && accessCount > 5 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 z-10"
          >
            <Badge variant="default" className="bg-blue-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {accessCount}x
            </Badge>
          </motion.div>
        )}

        {/* Botão de favorito */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => onFavoriteClick(e, app.id)}
          className="absolute top-2 left-2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
        >
          <Star 
            className={`h-4 w-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
          />
        </motion.button>

        <CardHeader>
          <motion.div 
            className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${app.color} mb-4`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className="h-6 w-6 text-white" />
          </motion.div>
          <CardTitle className="text-xl">{app.name}</CardTitle>
          <CardDescription className="text-base">
            {app.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={(e) => {
              e.stopPropagation();
              onAppClick(app);
            }}
          >
            Acessar {app.name}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
