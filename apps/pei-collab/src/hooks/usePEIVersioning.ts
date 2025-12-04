import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peiVersioningService, PEIVersion, CreateVersionParams } from '@/services/peiVersioningService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Interface para compatibilidade com código existente
export interface CreateVersionData {
  pei_id: string;
  change_type: 'created' | 'updated' | 'status_changed';
  change_summary: string;
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
  status?: string;
}

/**
 * Hook moderno usando React Query e o novo serviço
 */
export function usePEIVersioning(peiId: string | null) {
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery<PEIVersion[]>({
    queryKey: ['peiVersions', peiId],
    queryFn: () => peiVersioningService.getVersions(peiId!),
    enabled: !!peiId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar versão ativa (a mais recente)
  const activeVersion = versions.length > 0 ? versions[0] : null;

  const createVersion = useMutation({
    mutationFn: (params: CreateVersionParams) => peiVersioningService.createVersion(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peiVersions', peiId] });
      queryClient.invalidateQueries({ queryKey: ['pei', peiId] });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: ({ versionNumber }: { versionNumber: number }) =>
      peiVersioningService.restoreVersion(peiId!, versionNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peiVersions', peiId] });
      queryClient.invalidateQueries({ queryKey: ['pei', peiId] });
    },
  });

  const createSnapshot = useMutation({
    mutationFn: () => peiVersioningService.createSnapshot(peiId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peiVersions', peiId] });
    },
  });

  // Função de compatibilidade para código existente
  const createVersionLegacy = async (data: CreateVersionData) => {
    return await createVersion.mutateAsync({
      peiId: data.pei_id,
      changes: {
        diagnosis: data.diagnosis_data,
        planning: data.planning_data,
        evaluation: data.evaluation_data,
        status: data.status,
      },
      changeType: data.change_type,
      changeSummary: data.change_summary,
    });
  };

  // Função de compatibilidade para restore
  const restoreVersionLegacy = async (version: PEIVersion) => {
    return await restoreVersion.mutateAsync({
      versionNumber: version.version_number,
    });
  };

  // Função de compatibilidade para diff
  const getVersionDiff = async (version1: PEIVersion, version2: PEIVersion) => {
    try {
      const diff = await peiVersioningService.getVersionDiff(
        peiId!,
        version1.version_number,
        version2.version_number
      );
      
      // Retornar formato compatível
      const changes: string[] = [];
      if (diff.diagnosis_changed) changes.push('Diagnóstico');
      if (diff.planning_changed) changes.push('Planejamento');
      if (diff.evaluation_changed) changes.push('Avaliação');
      if (diff.status_changed) changes.push('Status');
      
      return changes;
    } catch (error) {
      console.error('Erro ao obter diff:', error);
      return [];
    }
  };

  return {
    versions,
    activeVersion,
    loading: isLoading,
    error: null,
    createVersion: createVersionLegacy,
    restoreVersion: restoreVersionLegacy,
    getVersionDiff,
    refreshVersions: () => {
      queryClient.invalidateQueries({ queryKey: ['peiVersions', peiId] });
    },
    // Novos métodos
    createVersionNew: createVersion.mutateAsync,
    restoreVersionNew: restoreVersion.mutateAsync,
    createSnapshot: createSnapshot.mutateAsync,
    isCreatingVersion: createVersion.isPending,
    isRestoringVersion: restoreVersion.isPending,
    isCreatingSnapshot: createSnapshot.isPending,
  };
}
