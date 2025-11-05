import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TenantInfo {
  id: string;
  name: string;
  type: 'network' | 'school';
  parentId?: string;
}

interface SchoolInfo {
  id: string;
  name: string;
  tenantId: string;
}

export const useTenant = () => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenantInfo();
  }, []);

  const loadTenantInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Buscar informações do usuário com tenant e school
      const { data: profile, error: profileError} = await supabase
        .from('profiles')
        .select('id, tenant_id, school_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Buscar role separadamente
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const primaryRole = userRoles?.[0]?.role || 'teacher';

      // Determinar tipo de tenant baseado no role
      if (primaryRole === 'education_secretary' || primaryRole === 'superadmin') {
        // Network admin - buscar tenant diretamente
        if (profile.tenant_id) {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id, network_name')
            .eq('id', profile.tenant_id)
            .single();

          if (tenantError) throw tenantError;

          setTenantInfo({
            id: tenant.id,
            name: tenant.network_name,
            type: 'network'
          });
        }
      } else if (profile.school_id) {
        // School user - buscar school e seu tenant
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select(`
            id,
            school_name,
            tenant_id,
            tenants(id, network_name)
          `)
          .eq('id', profile.school_id)
          .single();

        if (schoolError) throw schoolError;

        setSchoolInfo({
          id: school.id,
          name: school.school_name,
          tenantId: school.tenant_id
        });

        setTenantInfo({
          id: school.tenants.id,
          name: school.tenants.network_name,
          type: 'network'
        });
      }

    } catch (err: any) {
      console.error('Erro ao carregar informações de tenant:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getAccessibleSchools = async (): Promise<SchoolInfo[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar role do usuário
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const primaryRole = userRoles?.[0]?.role || 'teacher';

      if (primaryRole === 'education_secretary' || primaryRole === 'superadmin') {
        // Network admin - pode ver todas as escolas da rede
        const { data: schools } = await supabase
          .from('schools')
          .select('id, school_name, tenant_id')
          .eq('tenant_id', tenantInfo?.id);

        return schools || [];
      } else {
        // School user - apenas sua escola
        return schoolInfo ? [schoolInfo] : [];
      }
    } catch (err) {
      console.error('Erro ao buscar escolas acessíveis:', err);
      return [];
    }
  };

  const hasNetworkAccess = (): boolean => {
    return tenantInfo?.type === 'network' || false;
  };

  const hasSchoolAccess = (schoolId: string): boolean => {
    if (!schoolInfo) return false;
    return schoolInfo.id === schoolId;
  };

  return {
    tenantInfo,
    schoolInfo,
    loading,
    error,
    getAccessibleSchools,
    hasNetworkAccess,
    hasSchoolAccess,
    refresh: loadTenantInfo
  };
};


