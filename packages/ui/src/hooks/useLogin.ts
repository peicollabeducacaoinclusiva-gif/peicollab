import { useState } from 'react';
import { supabase } from '@pei/database';
import { saveAuthToken, ssoManager } from '@pei/auth';
import { toast } from 'sonner';

interface UseLoginOptions {
  validateProfile?: boolean;
  requireSchoolId?: boolean;
  allowedRoles?: string[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseLoginReturn {
  login: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook compartilhado para login com validação de perfil, rate limiting e SSO
 */
export function useLogin(options: UseLoginOptions = {}): UseLoginReturn {
  const {
    validateProfile = true,
    requireSchoolId = false,
    allowedRoles,
    onSuccess,
    onError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fazer login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos. Tente novamente.');
        }
        throw authError;
      }

      if (!data.user) {
        throw new Error('Erro ao fazer login. Tente novamente.');
      }

      // Validar perfil se necessário
      if (validateProfile) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_active, school_id')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw new Error('Erro ao verificar status do usuário.');
        }

        if (!profile?.is_active) {
          await supabase.auth.signOut();
          throw new Error('Sua conta está inativa. Entre em contato com o administrador.');
        }

        // Verificar roles se especificado
        if (allowedRoles && allowedRoles.length > 0) {
          const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          if (roleError) {
            throw new Error('Erro ao verificar permissões do usuário.');
          }

          const userRole = userRoles?.role;
          if (!allowedRoles.includes(userRole)) {
            await supabase.auth.signOut();
            throw new Error('Você não tem permissão para acessar este aplicativo.');
          }
        }

        // Verificar school_id se necessário
        if (requireSchoolId) {
          const rolesWithoutSchoolReq = ['superadmin', 'education_secretary'];
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          const userRole = userRoles?.role;
          if (userRole && !rolesWithoutSchoolReq.includes(userRole) && !profile?.school_id) {
            await supabase.auth.signOut();
            throw new Error('Sua conta ainda não foi vinculada a uma escola. Entre em contato com o administrador.');
          }
        }
      }

      // Salvar token para SSO entre apps
      if (data.session) {
        saveAuthToken(data.session);
        // Salvar também via SSO Manager para compartilhamento entre apps
        await ssoManager.saveSession(data.session, 'landing');
      }

      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login. Tente novamente.';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

