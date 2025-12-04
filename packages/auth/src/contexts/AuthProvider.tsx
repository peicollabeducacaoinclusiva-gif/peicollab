import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@pei/database/client';
import { ssoManager } from '../sso';
import { AuthContext } from './AuthContext';
import type { AuthUser, UserRole, UserProfile } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tentar restaurar sessão SSO primeiro
    const initSession = async () => {
      try {
        // Tentar restaurar sessão SSO
        const restoredSession = await ssoManager.restoreSession();
        
        if (restoredSession?.user) {
          // Sessão SSO restaurada, carregar perfil
          await loadUserProfile(restoredSession.user.id);
        } else {
          // Verificar sessão local do Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Salvar sessão para SSO
            await ssoManager.saveSession(session);
            await loadUserProfile(session.user.id);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error);
        setIsLoading(false);
      }
    };

    initSession();

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Salvar sessão para SSO
        await ssoManager.saveSession(session);
        await loadUserProfile(session.user.id);
      } else {
        // Limpar sessão SSO
        ssoManager.clearSession();
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Carregar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Perfil não encontrado');

      // Carregar roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      const roles = userRoles?.map((r) => r.role as UserRole) || [];
      const primaryRole = roles[0] || 'teacher';

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const typedProfile = profile as unknown as UserProfile;
        const mergedProfile: UserProfile = {
          ...typedProfile,
          email: typedProfile.email || authUser.email || '',
        };

        setUser({
          user: authUser,
          profile: mergedProfile,
          roles,
          primaryRole,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    ssoManager.clearSession();
    setUser(null);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}






