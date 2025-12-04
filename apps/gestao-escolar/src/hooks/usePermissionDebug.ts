import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from './useUserProfile';
import { PermissionAction, PermissionResource } from '@/services/permissionsService';
import { permissionsService } from '@/services/permissionsService';

interface PermissionCheckLog {
  action: PermissionAction;
  resource: PermissionResource;
  resourceId?: string;
  allowed: boolean | null;
  timestamp: Date;
  reason?: string;
}

interface PermissionDebugState {
  isEnabled: boolean;
  logs: PermissionCheckLog[];
  currentRole: string | null;
}

/**
 * Hook para DEBUG MODE de permissões
 * Permite visualizar qual permissão está bloqueando o quê
 */
export function usePermissionDebug() {
  const { data: profile } = useUserProfile();
  const [state, setState] = useState<PermissionDebugState>({
    isEnabled: localStorage.getItem('permission-debug') === 'true',
    logs: [],
    currentRole: null,
  });

  useEffect(() => {
    if (state.isEnabled && profile) {
      // Buscar role atual
      permissionsService.can('view', 'dashboard', {}).then((result) => {
        setState((prev) => ({ ...prev, currentRole: result.role || null }));
      });
    }
  }, [state.isEnabled, profile]);

  const logCheck = useCallback(
    (check: {
      action: PermissionAction;
      resource: PermissionResource;
      resourceId?: string;
      allowed: boolean | null;
    }) => {
      if (!state.isEnabled) return;

      setState((prev) => ({
        ...prev,
        logs: [
          ...prev.logs.slice(-99), // Manter apenas últimas 100 verificações
          {
            ...check,
            timestamp: new Date(),
          },
        ],
      }));
    },
    [state.isEnabled]
  );

  const toggle = useCallback(() => {
    const newEnabled = !state.isEnabled;
    localStorage.setItem('permission-debug', String(newEnabled));
    setState((prev) => ({
      ...prev,
      isEnabled: newEnabled,
      logs: newEnabled ? prev.logs : [],
    }));
  }, [state.isEnabled]);

  const clearLogs = useCallback(() => {
    setState((prev) => ({ ...prev, logs: [] }));
  }, []);

  const checkPermission = useCallback(
    async (
      action: PermissionAction,
      resource: PermissionResource,
      options?: { resourceId?: string; schoolId?: string; tenantId?: string }
    ) => {
      const result = await permissionsService.can(action, resource, options);
      logCheck({
        action,
        resource,
        resourceId: options?.resourceId,
        allowed: result.allowed,
      });
      return result;
    },
    [logCheck]
  );

  return {
    isEnabled: state.isEnabled,
    logs: state.logs,
    currentRole: state.currentRole,
    toggle,
    clearLogs,
    logCheck,
    checkPermission,
  };
}
