import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';

export function useUserProfile() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('[useUserProfile] Iniciando busca de perfil...');
        setIsLoading(true);
        
        console.log('[useUserProfile] Chamando supabase.auth.getUser()...');
        const { data: { user }, error: userError } = await Promise.race([
          supabase.auth.getUser(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 10000)
          )
        ]) as any;
        console.log('[useUserProfile] getUser() retornou');
        
        if (userError) {
          console.error('[useUserProfile] Erro ao buscar usuário:', userError);
          throw userError;
        }
        
        if (!user) {
          console.warn('[useUserProfile] Nenhum usuário autenticado');
          setData(null);
          setIsLoading(false);
          return;
        }

        console.log('[useUserProfile] Usuário encontrado:', user.id);

        // Buscar perfil sem joins complexos primeiro
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, tenant_id, school_id, is_active')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('[useUserProfile] Erro ao buscar perfil:', profileError);
          throw profileError;
        }

        if (!profileData) {
          console.warn('[useUserProfile] Perfil não encontrado para usuário:', user.id);
          setData(null);
          setIsLoading(false);
          return;
        }

        console.log('[useUserProfile] Perfil encontrado:', profileData);

        // Buscar role
        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1);

        if (roleError) {
          console.error('[useUserProfile] Erro ao buscar role:', roleError);
        }

        console.log('[useUserProfile] Role encontrada:', userRoles?.[0]?.role);

        // Buscar tenant separadamente (se tiver)
        let tenant = null;
        if (profileData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('id, network_name')
            .eq('id', profileData.tenant_id)
            .single();
          tenant = tenantData;
        }

        // Buscar school separadamente (se tiver)
        let school = null;
        if (profileData.school_id) {
          const { data: schoolData } = await supabase
            .from('schools')
            .select('school_name')
            .eq('id', profileData.school_id)
            .single();
          school = schoolData;
        }

        // Fallback para user_tenants se não tiver tenant_id no profile
        let tenantId = profileData.tenant_id;
        if (!tenantId) {
          const { data: userTenant } = await supabase
            .from('user_tenants')
            .select('tenant_id')
            .eq('user_id', user.id)
            .maybeSingle();
          tenantId = userTenant?.tenant_id || null;
          console.log('[useUserProfile] TenantId via user_tenants:', tenantId);
        }

        const result = {
          ...profileData,
          tenant_id: tenantId,
          role: userRoles?.[0]?.role || 'teacher',
          tenant: tenant || (tenantId ? { id: tenantId, network_name: null } : null),
          school: school || null,
        };

        console.log('[useUserProfile] Perfil completo:', result);
        setData(result);
        setIsLoading(false);
      } catch (err: any) {
        console.error('[useUserProfile] Erro geral:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { data, isLoading, error };
}

