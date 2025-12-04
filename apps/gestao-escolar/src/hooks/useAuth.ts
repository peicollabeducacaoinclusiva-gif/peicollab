import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@pei/database';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Verificar sessão atual
    const getInitialSession = async () => {
      try {
        // Primeiro, tentar restaurar sessão SSO se existir
        try {
          const { ssoManager } = await import('@pei/auth');
          const restoredSession = await ssoManager.restoreSession();
          if (restoredSession) {
            console.log('✅ Sessão SSO restaurada com sucesso');
            setAuthState({
              user: restoredSession.user,
              loading: false,
              error: null
            });
            return;
          }
        } catch (ssoError) {
          console.log('ℹ️ Nenhuma sessão SSO encontrada, verificando sessão local...');
        }

        // Se não houver SSO, verificar sessão local
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setAuthState({
            user: null,
            loading: false,
            error: error.message
          });
          return;
        }

        setAuthState({
          user: session?.user || null,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Erro inesperado:', error);
        setAuthState({
          user: null,
          loading: false,
          error: 'Erro inesperado ao verificar autenticação'
        });
      }
    };

    getInitialSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setAuthState({
          user: session?.user || null,
          loading: false,
          error: null
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
        return;
      }

      setAuthState({
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro inesperado ao fazer logout'
      }));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro ao fazer login:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
        return { success: false, error: error.message };
      }

      setAuthState({
        user: data.user,
        loading: false,
        error: null
      });

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      const errorMessage = 'Erro inesperado ao fazer login';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        console.error('Erro ao criar conta:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
        return { success: false, error: error.message };
      }

      setAuthState({
        user: data.user,
        loading: false,
        error: null
      });

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      const errorMessage = 'Erro inesperado ao criar conta';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!authState.user
  };
}
