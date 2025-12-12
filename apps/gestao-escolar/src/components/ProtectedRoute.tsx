import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@pei/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
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
              setIsAuthenticated(true);
              setLoading(false);
              return;
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
              
              // Verificar sessão criada
              const { data: { session } } = await supabase.auth.getSession();
              setIsAuthenticated(!!session);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Erro ao processar SSO:', error);
            // Remover código e continuar com verificação normal
            searchParams.delete('sso_code');
            setSearchParams(searchParams, { replace: true });
          }
        }

        // Verificar sessão atual (normal)
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();

    // Ouvir mudanças na autenticação
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event, 'Session:', !!session);
        setIsAuthenticated(!!session);
        // Se a sessão foi criada, atualizar estado imediatamente
        if (event === 'SIGNED_IN' && session) {
          setLoading(false);
        }
        // Se foi deslogado, garantir que o estado seja atualizado
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setLoading(false);
        }
      });
      subscription = authSubscription;
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Erro ao desinscrever listener de autenticação:', error);
        }
      }
    };
  }, [searchParams, setSearchParams]);

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

