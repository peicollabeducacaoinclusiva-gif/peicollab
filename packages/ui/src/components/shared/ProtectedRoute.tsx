import { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@pei/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string[];
  requireActiveProfile?: boolean;
  requireSchoolId?: boolean;
  fallbackPath?: string;
}

/**
 * Componente compartilhado para proteger rotas que requerem autenticação
 * Suporta verificação de sessão Supabase, SSO code e validação de roles
 */
export function ProtectedRoute({
  children,
  requireRole,
  requireActiveProfile = false,
  requireSchoolId = false,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const checkAuth = useCallback(async () => {
    try {
      // PRIMEIRO: Tentar restaurar sessão SSO se existir
      try {
        const { ssoManager } = await import('@pei/auth');
        const restoredSession = await ssoManager.restoreSession();
        
        if (restoredSession) {
          console.log('✅ Sessão SSO restaurada com sucesso no ProtectedRoute');
          // Definir sessão no Supabase
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: restoredSession.access_token,
            refresh_token: restoredSession.refresh_token,
          });
          
          if (!sessionError) {
            // Continuar com validação de perfil/roles abaixo
            // Não retornar aqui, deixar continuar para validar perfil/roles
          } else {
            console.warn('⚠️ Erro ao definir sessão SSO:', sessionError);
          }
        }
      } catch (ssoError) {
        console.log('ℹ️ Nenhuma sessão SSO encontrada, verificando sessão local...');
      }

      // Verificar se há código SSO na URL (para login automático entre apps)
      const ssoCode = searchParams.get('sso_code');

      if (ssoCode) {
        try {
          // Validar código via Edge Function
          const { data, error } = await supabase.functions.invoke('validate-sso-code', {
            body: { code: ssoCode }
          });
          
          if (error || !data) {
            console.error('Código SSO inválido:', error);
            // Remover código da URL e continuar com auth normal
            searchParams.delete('sso_code');
            setSearchParams(searchParams, { replace: true });
          } else {
            // Criar sessão local
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });
            
            if (sessionError) {
              console.error('Erro ao criar sessão:', sessionError);
            }
            
            // Remover código da URL
            searchParams.delete('sso_code');
            setSearchParams(searchParams, { replace: true });
            
            // Verificar sessão criada e continuar com validação normal
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              setIsAuthenticated(false);
              setLoading(false);
              return;
            }
            // Continuar com validação de perfil/roles abaixo
          }
        } catch (error) {
          console.error('Erro ao processar SSO:', error);
          // Remover código e continuar com verificação normal
          searchParams.delete('sso_code');
          setSearchParams(searchParams, { replace: true });
        }
      }

      // Verificar sessão Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);

        // Verificar perfil se necessário
        if (requireActiveProfile || requireSchoolId || requireRole) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_active, school_id')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }

          // Verificar perfil ativo
          if (requireActiveProfile && !profile?.is_active) {
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }

          // Verificar school_id
          if (requireSchoolId) {
            const rolesWithoutSchoolReq = ['superadmin', 'education_secretary'];
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();

            const userRole = userRoles?.role;
            if (userRole && !rolesWithoutSchoolReq.includes(userRole) && !profile?.school_id) {
              setIsAuthenticated(false);
              setLoading(false);
              return;
            }
          }

          // Verificar roles
          if (requireRole && requireRole.length > 0) {
            const { data: userRoles, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();

            if (roleError || !userRoles) {
              setHasPermission(false);
              setLoading(false);
              return;
            }

            if (!requireRole.includes(userRoles.role)) {
              setHasPermission(false);
              setLoading(false);
              return;
            }
          }
        }
      } else {
        // Sem sessão, usuário não autenticado
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams, requireRole, requireActiveProfile, requireSchoolId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasPermission) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

