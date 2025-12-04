import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import { useTenant } from '@/hooks/useTenant';

export interface EnabledModule {
  module_name: string;
  display_name: string;
  icon: string;
  is_public: boolean;
  settings: Record<string, any>;
}

/**
 * Hook para verificar módulos habilitados para o tenant atual
 */
export function useModules() {
  const { tenantId } = useTenant();
  
  const { data: enabledModules, isLoading, error, refetch } = useQuery<EnabledModule[]>({
    queryKey: ['enabled-modules', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .rpc('get_enabled_modules', { p_tenant_id: tenantId });
      
      if (error) {
        console.error('Erro ao buscar módulos habilitados:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
  
  /**
   * Verifica se um módulo está habilitado para o tenant
   */
  const isModuleEnabled = (moduleName: string): boolean => {
    return enabledModules?.some(m => m.module_name === moduleName) ?? false;
  };
  
  /**
   * Retorna as configurações de um módulo específico
   */
  const getModuleSettings = (moduleName: string): Record<string, any> | undefined => {
    return enabledModules?.find(m => m.module_name === moduleName)?.settings;
  };
  
  /**
   * Retorna lista de módulos habilitados
   */
  const getEnabledModulesList = (): string[] => {
    return enabledModules?.map(m => m.module_name) || [];
  };
  
  return { 
    enabledModules: enabledModules || [],
    isLoading,
    error,
    isModuleEnabled,
    getModuleSettings,
    getEnabledModulesList,
    refetch,
  };
}

