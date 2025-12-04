import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@pei/auth';
import {
  hasPermission,
  hasPermissions,
  canAccessResource,
  canAccessStudent,
  canAccessClass,
  isDataFieldVisible,
  Permission,
  ResourceType,
  Role,
} from '@pei/auth/permissions/granularPermissions';

/**
 * Hook para verificar uma permissão específica
 */
export function usePermission(
  permission: Permission,
  resourceType?: ResourceType,
  resourceId?: string
) {
  const { user } = useAuth();

  return useQuery<boolean>({
    queryKey: ['permission', user?.id, permission, resourceType, resourceId],
    queryFn: () => {
      if (!user?.id) return false;
      return hasPermission(user.id, permission, resourceType, resourceId);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para verificar múltiplas permissões
 */
export function usePermissions(
  checks: Array<{
    permission: Permission;
    resourceType?: ResourceType;
    resourceId?: string;
  }>
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['permissions', user?.id, JSON.stringify(checks)],
    queryFn: () => {
      if (!user?.id) return {};
      return hasPermissions(user.id, checks);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para verificar acesso a um recurso
 */
export function useResourceAccess(
  resourceType: ResourceType,
  resourceId: string,
  permission: Permission = 'view'
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resourceAccess', user?.id, resourceType, resourceId, permission],
    queryFn: () => {
      if (!user?.id) return { hasPermission: false };
      return canAccessResource(user.id, resourceType, resourceId, permission);
    },
    enabled: !!user?.id && !!resourceId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para verificar acesso a um aluno
 */
export function useStudentAccess(studentId: string, permission: Permission = 'view') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['studentAccess', user?.id, studentId, permission],
    queryFn: () => {
      if (!user?.id) return { hasPermission: false };
      return canAccessStudent(user.id, studentId, permission);
    },
    enabled: !!user?.id && !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para verificar acesso a uma turma
 */
export function useClassAccess(classId: string, permission: Permission = 'view') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['classAccess', user?.id, classId, permission],
    queryFn: () => {
      if (!user?.id) return { hasPermission: false };
      return canAccessClass(user.id, classId, permission);
    },
    enabled: !!user?.id && !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para verificar visibilidade de campo (LGPD)
 */
export function useDataFieldVisibility(role: Role, dataField: string) {
  return useQuery({
    queryKey: ['dataFieldVisibility', role, dataField],
    queryFn: () => isDataFieldVisible(role, dataField),
    staleTime: 1000 * 60 * 30, // 30 minutos (configuração muda pouco)
  });
}

