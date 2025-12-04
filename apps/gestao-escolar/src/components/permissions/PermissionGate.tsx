import { ReactNode, useEffect, useState } from 'react';
import { useCan } from '@/hooks/useCan';
import { PermissionAction, PermissionResource } from '@/services/permissionsService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { usePermissionDebug } from '@/hooks/usePermissionDebug';

interface PermissionGateProps {
  action: PermissionAction;
  resource: PermissionResource;
  resourceId?: string;
  schoolId?: string;
  tenantId?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showDebug?: boolean;
}

/**
 * Componente que renderiza children apenas se o usuário tiver permissão
 */
export function PermissionGate({
  action,
  resource,
  resourceId,
  schoolId,
  tenantId,
  children,
  fallback,
  showDebug = false,
}: PermissionGateProps) {
  const { can, loading } = useCan();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const debug = usePermissionDebug();

  useEffect(() => {
    can(action, resource, { resourceId, schoolId, tenantId }).then(setHasPermission);
  }, [can, action, resource, resourceId, schoolId, tenantId]);

  // Mostrar debug se habilitado
  if (showDebug || debug.isEnabled) {
    debug.logCheck({ action, resource, resourceId, allowed: hasPermission });
  }

  if (loading || hasPermission === null) {
    return null; // ou um skeleton
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showDebug || debug.isEnabled) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Permissão Negada</AlertTitle>
          <AlertDescription>
            Você não tem permissão para <strong>{action}</strong> em <strong>{resource}</strong>
            {resourceId && ` (ID: ${resourceId})`}
            {debug.isEnabled && (
              <div className="mt-2 text-xs">
                Role: {debug.currentRole} | Verifique o DEBUG MODE para mais detalhes
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}
