import { ComponentType, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCan } from '@/hooks/useCan';
import { PermissionAction, PermissionResource } from '@/services/permissionsService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

interface RequirePermissionOptions {
  action: PermissionAction;
  resource: PermissionResource;
  resourceId?: string;
  redirectTo?: string;
  fallback?: ComponentType;
}

/**
 * HOC (Higher Order Component) para proteger rotas com permissões
 * 
 * @example
 * const ProtectedStudentList = requirePermission(StudentList, {
 *   action: 'view',
 *   resource: 'student',
 *   redirectTo: '/unauthorized'
 * });
 */
export function requirePermission<P extends object>(
  Component: ComponentType<P>,
  options: RequirePermissionOptions
) {
  return function ProtectedComponent(props: P) {
    const location = useLocation();
    const { can, loading } = useCan();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
      can(options.action, options.resource, {
        resourceId: options.resourceId,
      }).then(setHasPermission);
    }, [can, options.action, options.resource, options.resourceId]);

    if (loading || hasPermission === null) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      );
    }

    if (!hasPermission) {
      if (options.redirectTo) {
        return (
          <Navigate
            to={options.redirectTo}
            state={{ from: location, reason: 'Sem permissão para acessar este recurso' }}
            replace
          />
        );
      }

      const FallbackComponent = options.fallback;
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar esta página.
              <br />
              <span className="text-xs mt-2 block">
                Ação requerida: <strong>{options.action}</strong> em <strong>{options.resource}</strong>
              </span>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
