import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';

interface TenantDomain {
  id: string;
  tenant_id: string;
  subdomain: string;
  custom_domain?: string;
  is_active: boolean;
  tenant: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    customization?: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
      institution_name?: string;
      theme?: string;
    };
  };
}

export function useTenantFromDomain() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Extrair subdomínio
  // Ex: saogoncalo.peicollab.com.br → saogoncalo
  // Ex: saogoncalo.localhost → saogoncalo
  const parts = hostname.split('.');
  const subdomain = parts[0];
  
  // Se for localhost ou IP, usar tenant padrão
  const isLocalhost = hostname.includes('localhost') || hostname.match(/^\d+\.\d+\.\d+\.\d+$/);
  
  return useQuery({
    queryKey: ['tenant-from-domain', subdomain],
    queryFn: async (): Promise<TenantDomain | null> => {
      // Se for localhost sem subdomínio, retornar null (modo desenvolvimento)
      if (isLocalhost && (subdomain === 'localhost' || (subdomain && subdomain.match(/^\d+$/)))) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('tenant_domains')
        .select(`
          *,
          tenant:tenants(
            id,
            name,
            city,
            state,
            customization
          )
        `)
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.warn('Tenant não encontrado para subdomínio:', subdomain);
        return null;
      }
      
      return data as any;
    },
    enabled: !!subdomain,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    retry: 1,
  });
}

