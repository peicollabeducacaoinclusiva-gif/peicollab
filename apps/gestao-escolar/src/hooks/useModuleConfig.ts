import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleConfigService, ModuleConfig, ModuleName } from '../services/moduleConfigService';
import { useUserProfile } from './useUserProfile';

export function useModuleConfigs() {
  const { data: userProfile } = useUserProfile();
  const tenantId = userProfile?.tenant_id;

  return useQuery<ModuleConfig[]>({
    queryKey: ['moduleConfigs', tenantId],
    queryFn: () => moduleConfigService.getModuleConfigs(tenantId!),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useModuleEnabled(moduleName: ModuleName) {
  const { data: userProfile } = useUserProfile();
  const tenantId = userProfile?.tenant_id;

  return useQuery<boolean>({
    queryKey: ['moduleEnabled', tenantId, moduleName],
    queryFn: () => moduleConfigService.isModuleEnabled(tenantId!, moduleName),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useUpdateModuleConfig() {
  const queryClient = useQueryClient();
  const { data: userProfile } = useUserProfile();
  const tenantId = userProfile?.tenant_id;

  return useMutation({
    mutationFn: ({
      moduleName,
      enabled,
      config,
    }: {
      moduleName: ModuleName;
      enabled: boolean;
      config?: Record<string, any>;
    }) => moduleConfigService.updateModuleConfig(tenantId!, moduleName, enabled, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleConfigs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['moduleEnabled', tenantId] });
    },
  });
}

