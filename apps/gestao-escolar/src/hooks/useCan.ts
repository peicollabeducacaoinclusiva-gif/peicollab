import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { permissionsService, PermissionAction, PermissionResource } from '../services/permissionsService';
import { useUserProfile } from './useUserProfile';

/**
 * Hook universal para verificação de permissões
 * 
 * @example
 * const { can, loading } = useCan();
 * if (can('edit', 'student')) {
 *   // Usuário pode editar alunos
 * }
 * 
 * @example
 * const { canView, canEdit } = useCan('student', { resourceId: '123' });
 * if (canView) {
 *   // Mostrar dados do estudante
 * }
 */
export function useCan() {
  const { data: profile } = useUserProfile();

  // Cache de permissões do usuário atual
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissions', 'current-user'],
    queryFn: async () => {
      // Pre-carregar role principal
      const result = await permissionsService.can('view', 'dashboard', {});
      return result;
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  /**
   * Verificar permissão
   */
  const can = async (
    action: PermissionAction,
    resource: PermissionResource,
    options?: {
      resourceId?: string;
      schoolId?: string;
      tenantId?: string;
    }
  ): Promise<boolean> => {
    const result = await permissionsService.can(action, resource, options);
    return result.allowed;
  };

  /**
   * Verificar múltiplas permissões (todas devem ser true)
   */
  const canAll = async (
    checks: Array<{
      action: PermissionAction;
      resource: PermissionResource;
      resourceId?: string;
    }>
  ): Promise<boolean> => {
    const results = await permissionsService.canAll(checks);
    return results.every((r) => r.allowed);
  };

  /**
   * Verificar múltiplas permissões (pelo menos uma deve ser true)
   */
  const canAny = async (
    checks: Array<{
      action: PermissionAction;
      resource: PermissionResource;
      resourceId?: string;
    }>
  ): Promise<boolean> => {
    const result = await permissionsService.canAny(checks);
    return result.allowed;
  };

  return {
    can,
    canAll,
    canAny,
    loading: isLoading,
    role: permissions?.role,
  };
}

/**
 * Hook específico para um recurso (com cache)
 */
export function useCanResource(
  resource: PermissionResource,
  options?: {
    resourceId?: string;
    schoolId?: string;
    tenantId?: string;
  }
) {
  const { data: profile } = useUserProfile();

  // Cache de permissões para este recurso
  const permissionQueries = useQuery({
    queryKey: ['permissions', 'resource', resource, options?.resourceId],
    queryFn: async () => {
      const [canView, canCreate, canEdit, canDelete] = await Promise.all([
        permissionsService.can('view', resource, options),
        permissionsService.can('create', resource, options),
        permissionsService.can('edit', resource, options),
        permissionsService.can('delete', resource, options),
      ]);

      return {
        canView: canView.allowed,
        canCreate: canCreate.allowed,
        canEdit: canEdit.allowed,
        canDelete: canDelete.allowed,
        canExport: (await permissionsService.can('export', resource, options)).allowed,
        canManage: (await permissionsService.can('manage', resource, options)).allowed,
      };
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...permissionQueries.data,
    loading: permissionQueries.isLoading,
    error: permissionQueries.error,
  };
}
