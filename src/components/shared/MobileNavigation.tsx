import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  Home, 
  Users, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  Bell,
  User,
  LogOut,
  ChevronRight,
  Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  roles?: string[];
}

interface MobileNavigationProps {
  userRole: string;
  className?: string;
}

export function MobileNavigation({ userRole, className = '' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pendingChanges } = useOfflineSync();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      path: '/dashboard',
      roles: ['superadmin', 'education_secretary', 'school_director', 'coordinator', 'teacher', 'aee_teacher', 'specialist', 'school_manager']
    },
    // ATENÇÃO: /students, /peis e /reports são rotas de ADMINISTRAÇÃO que mostram TODOS os dados
    // Professores NÃO devem ter acesso a essas rotas - eles usam as tabs do dashboard
    {
      id: 'students',
      label: 'Alunos',
      icon: <Users className="h-5 w-5" />,
      path: '/students',
      roles: ['superadmin'] // APENAS superadmin tem acesso à visão global de todos os alunos
    },
    {
      id: 'peis',
      label: 'PEIs',
      icon: <GraduationCap className="h-5 w-5" />,
      path: '/peis',
      badge: pendingChanges,
      roles: ['superadmin'] // APENAS superadmin tem acesso à visão global de todos os PEIs
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/reports',
      roles: ['superadmin'] // 🔒 APENAS superadmin - Relatórios multi-rede com dados de todas as redes
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings',
      roles: ['superadmin', 'education_secretary', 'school_director'] // Apenas gestores de alto nível
    }
  ];

  // Adicionar itens de debug para superadmin
  const debugItems: NavigationItem[] = [
    {
      id: 'debug-database',
      label: 'Testes de Banco',
      icon: <Database className="h-5 w-5" />,
      path: '/debug/database',
      roles: ['superadmin']
    },
    {
      id: 'debug-usability',
      label: 'Testes de Usabilidade',
      icon: <Users className="h-5 w-5" />,
      path: '/debug/usability',
      roles: ['superadmin']
    },
    {
      id: 'debug-notifications',
      label: 'Notificações',
      icon: <Bell className="h-5 w-5" />,
      path: '/debug/notifications',
      roles: ['superadmin']
    }
  ];

  const allItems = [...navigationItems, ...debugItems];

  const filteredItems = allItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className={`lg:hidden ${className}`}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Menu className="h-4 w-4" />
            {pendingChanges > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {pendingChanges}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              PEI Collab
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-2">
            {filteredItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start h-12 px-4"
                onClick={() => handleNavigation(item.path)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4"
                onClick={() => handleNavigation('/notifications')}
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Notificações</span>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4"
                onClick={() => handleNavigation('/profile')}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Perfil</span>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair</span>
                </div>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
