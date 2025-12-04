import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';

interface PermissionState {
  canManageNetwork: boolean;
  canManageSchool: boolean;
  canAccessPEI: (peiId: string) => Promise<boolean>;
  canManageUser: (userId: string) => Promise<boolean>;
  hasRole: (role: string) => Promise<boolean>;
  primaryRole: string | null;
  loading: boolean;
  error: string | null;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionState>({
    canManageNetwork: false,
    canManageSchool: false,
    canAccessPEI: async () => false,
    canManageUser: async () => false,
    hasRole: async () => false,
    primaryRole: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPermissions(prev => ({ ...prev, loading: false, error: 'Usuário não autenticado' }));
        return;
      }

      // Buscar role principal
      const { data: primaryRole } = await supabase
        .rpc('get_user_primary_role', { _user_id: user.id });

      // Verificar permissões de rede
      const { data: tenantId } = await supabase
        .rpc('get_user_tenant_safe', { _user_id: user.id });

      let canManageNetwork = false;
      if (tenantId && primaryRole) {
        const { data: networkAccess } = await supabase
          .rpc('can_manage_network', { 
            _user_id: user.id, 
            _tenant_id: tenantId 
          });
        canManageNetwork = networkAccess || false;
      }

      // Verificar permissões de escola
      const { data: schoolId } = await supabase
        .rpc('get_user_school_id', { _user_id: user.id });

      const canManageSchool = primaryRole === 'school_director' || 
                             primaryRole === 'education_secretary' || 
                             primaryRole === 'superadmin';

      setPermissions({
        canManageNetwork,
        canManageSchool,
        canAccessPEI: async (peiId: string) => {
          const { data } = await supabase
            .rpc('user_can_access_pei', { 
              _user_id: user.id, 
              _pei_id: peiId 
            });
          return data || false;
        },
        canManageUser: async (userId: string) => {
          // Superadmin pode gerenciar qualquer usuário
          if (primaryRole === 'superadmin') return true;
          
          // Education secretary pode gerenciar usuários da sua rede
          if (primaryRole === 'education_secretary') {
            const { data: userTenant } = await supabase
              .rpc('get_user_tenant_safe', { _user_id: userId });
            return userTenant === tenantId;
          }
          
          // School director pode gerenciar usuários da sua escola
          if (primaryRole === 'school_director' && schoolId) {
            const { data: userSchool } = await supabase
              .rpc('get_user_school_id', { _user_id: userId });
            return userSchool === schoolId;
          }
          
          return false;
        },
        hasRole: async (role: string) => {
          const { data } = await supabase
            .rpc('has_role', { 
              _user_id: user.id, 
              _role: role as any
            });
          return data || false;
        },
        primaryRole: primaryRole as any,
        loading: false,
        error: null
      });

    } catch (err: any) {
      console.error('Erro ao carregar permissões:', err);
      setPermissions(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Erro desconhecido' 
      }));
    }
  };

  const checkPEIAccess = async (peiId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .rpc('user_can_access_pei', { 
          _user_id: (await supabase.auth.getUser()).data.user?.id, 
          _pei_id: peiId 
        });
      return data || false;
    } catch (err) {
      console.error('Erro ao verificar acesso ao PEI:', err);
      return false;
    }
  };

  const checkSchoolAccess = async (schoolId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .rpc('user_has_school_access', { 
          _user_id: (await supabase.auth.getUser()).data.user?.id, 
          _school_id: schoolId 
        });
      return data || false;
    } catch (err) {
      console.error('Erro ao verificar acesso à escola:', err);
      return false;
    }
  };

  return {
    ...permissions,
    checkPEIAccess,
    checkSchoolAccess,
    refresh: loadPermissions
  };
};


