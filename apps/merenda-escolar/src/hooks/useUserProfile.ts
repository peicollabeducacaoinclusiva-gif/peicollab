import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          full_name,
          email,
          tenant_id,
          school_id,
          school:schools!profiles_school_id_fkey(school_name),
          tenant:tenants!profiles_tenant_id_fkey(id, network_name)
        `)
        .eq('id', user.id)
        .single();

      if (!profileData) return null;

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .limit(1);

      return {
        ...profileData,
        role: userRoles?.[0]?.role || 'teacher',
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });
}

