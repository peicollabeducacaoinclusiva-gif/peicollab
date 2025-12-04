import { ReactNode } from 'react';
import { AppSwitcher } from '../../AppSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useUserProfile, UserProfile } from '../../hooks/useUserProfile';
import { getCurrentAppId, getAppName, getAppLogo } from '../../lib/appUtils';

interface AppHeaderProps {
  appName?: string; // nome do app (opcional, detecta automaticamente se não fornecido)
  appLogo?: string; // caminho do logo do app (opcional, detecta automaticamente se não fornecido)
  currentApp?: string; // id do app para AppSwitcher (opcional, detecta automaticamente se não fornecido)
  showInstitutionalLogo?: boolean; // mostrar logo da rede
  showNetworkName?: boolean; // mostrar nome da rede
  showWelcome?: boolean; // mostrar boas-vindas
  customActions?: ReactNode; // ações customizadas (ex: botão "Novo Plano AEE")
  userProfile?: UserProfile; // perfil do usuário (opcional, se não fornecido, busca automaticamente)
  onLogout?: () => void; // callback para logout customizado
  showUserInfo?: boolean; // mostrar informações do usuário na direita
  className?: string; // classes CSS adicionais
}

// Componente simplificado de InstitutionalLogo (sem edição)
function SimpleInstitutionalLogo({ tenantId }: { tenantId?: string | null }) {
  if (!tenantId) return null;
  
  return (
    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20 flex items-center justify-center border-2 border-primary/20 dark:border-primary/30">
      <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  );
}

const getRoleLabel = (role?: string) => {
  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    education_secretary: 'Secretário de Educação',
    school_manager: 'Gestor Escolar',
    school_director: 'Diretor Escolar',
    coordinator: 'Coordenador',
    teacher: 'Professor',
    aee_teacher: 'Professor AEE',
    specialist: 'Especialista',
    support_professional: 'Profissional de Apoio',
    family: 'Família',
  };
  return roleLabels[role || ''] || role || 'Usuário';
};

export function AppHeader({
  appName: providedAppName,
  appLogo: providedAppLogo,
  currentApp: providedCurrentApp,
  showInstitutionalLogo = true,
  showNetworkName = true,
  showWelcome = true,
  customActions,
  userProfile: providedProfile,
  onLogout,
  showUserInfo = true,
  className = '',
}: AppHeaderProps) {
  const { profile: fetchedProfile } = useUserProfile();
  const profile = providedProfile || fetchedProfile;
  
  // Detectar app atual se não fornecido
  const currentApp = providedCurrentApp || getCurrentAppId();
  const appName = providedAppName || getAppName(currentApp);
  const appLogo = providedAppLogo || getAppLogo(currentApp);

  return (
    <header className={`border-b bg-card shadow-sm sticky top-0 z-10 ${className}`}>
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-3 items-center gap-2 sm:gap-4">
          {/* Esquerda: Logo da Rede */}
          <div className="flex items-center justify-start">
            {showInstitutionalLogo && profile && (
              <SimpleInstitutionalLogo tenantId={profile.tenant_id} />
            )}
          </div>

          {/* Centro: Logo App + Nome da Rede + Boas-vindas */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <img 
                src={appLogo} 
                alt={appName} 
                className="h-6 sm:h-8 w-auto" 
              />
              <h1 className="font-bold text-base sm:text-xl text-primary">
                {appName}
              </h1>
            </div>
            {profile && showNetworkName && profile.tenant_id && (
              <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1 hidden md:block truncate max-w-full">
                {profile.network_name && profile.school_name ? (
                  <span className="truncate">{profile.network_name} • {profile.school_name}</span>
                ) : (
                  <span className="truncate">{profile.network_name || profile.school_name}</span>
                )}
              </div>
            )}
            {profile && showWelcome && (
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden lg:block">
                Olá, {profile.full_name.split(' ')[0]}! • {getRoleLabel(profile.role)}
              </div>
            )}
          </div>

          {/* Direita: Usuário + Ações */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {profile && showUserInfo && (
              <div className="text-right hidden lg:block mr-2">
                <p className="text-sm font-medium truncate max-w-[150px]">
                  {profile.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {getRoleLabel(profile.role)}
                </p>
              </div>
            )}
            {customActions}
            <AppSwitcher currentApp={currentApp} />
            <ThemeToggle />
            <UserMenu onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}

