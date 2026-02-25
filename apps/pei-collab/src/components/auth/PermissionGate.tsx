import { ReactNode } from 'react';

import { usePermissions } from '@/hooks/usePermissions';

type PermissionKey =
  | 'canCreateDocument'
  | 'canApproveDocument'
  | 'canEditTemplate'
  | 'canManageUsers'
  | 'canCreateStudent'
  | 'canCreateSchool'
  | 'canManageFamilyLinks'
  | 'canFamilyComment'
  | 'canFamilyAcknowledge'
  | 'canViewAllStudents'
  | 'canCreateVersion';

type PermissionGateProps = {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const permissions = usePermissions();

  if (permissions.loading)
    return (
      fallback ?? (
        <span
          className="inline-block h-9 w-[180px] animate-pulse rounded-md bg-muted"
          aria-hidden
        />
      )
    );

  const permissionMap: Record<PermissionKey, () => boolean> = {
    canCreateDocument: permissions.canCreateDocument,
    canApproveDocument: permissions.canApproveDocument,
    canEditTemplate: permissions.canEditTemplate,
    canManageUsers: permissions.canManageUsers,
    canCreateStudent: permissions.canCreateStudent,
    canCreateSchool: permissions.canCreateSchool,
    canManageFamilyLinks: permissions.canManageFamilyLinks,
    canFamilyComment: permissions.canFamilyComment,
    canFamilyAcknowledge: permissions.canFamilyAcknowledge,
    canViewAllStudents: permissions.canViewAllStudents,
    canCreateVersion: permissions.canCreateVersion,
  };

  const isAllowed = permissionMap[permission]();
  if (!isAllowed) return fallback;

  return <>{children}</>;
}
