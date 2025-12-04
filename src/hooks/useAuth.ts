import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { reportAuthError } from '@/lib/errorReporting';

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
      async (event, session) => {
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
        
        // Reportar erro crítico de autenticação
        const errorObj = new Error(error.message);
        reportAuthError(errorObj, {
          operation: 'login',
          email: email,
        }).catch(err => console.error('Erro ao reportar erro de login:', err));
        
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

  /**
   * @deprecated O signup público foi removido. Use a Edge Function create-user via administrador.
   * Esta função é mantida apenas para compatibilidade e não deve ser usada em produção.
   */
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
