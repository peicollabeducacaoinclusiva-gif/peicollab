import { useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { authorize, type AuthUser, type Permission, type Role } from '@/lib/rbac';

function getRoleFromMetadata(metadata: Record<string, unknown> | null | undefined): Role | null {
  const role = metadata?.role;
  if (
    role === 'admin_rede' ||
    role === 'gestor_escolar' ||
    role === 'coordenador' ||
    role === 'professor_regente' ||
    role === 'professor_aee' ||
    role === 'familia'
  ) {
    return role;
  }
  return null;
}

export function usePermissions() {
  const [user, setUser] = useState<(AuthUser & { email?: string; name?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      const role = getRoleFromMetadata(data.user?.user_metadata ?? null);
      if (data.user && role) {
        const meta = data.user.user_metadata as Record<string, unknown> | null;
        const name = (meta?.name as string) ?? data.user.email?.split('@')[0] ?? undefined;
        setUser({
          id: data.user.id,
          role,
          email: data.user.email ?? undefined,
          name: name || undefined,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const can = useMemo(() => {
    return (permission: Permission) => authorize(user, permission);
  }, [user]);

  return {
    loading,
    user,
    canCreateDocument: () => can('documents:create'),
    canEditDocument: () => can('documents:edit'),
    canApproveDocument: () => can('documents:approve'),
    canEditTemplate: () => can('templates:edit'),
    canManageUsers: () => can('users:manage'),
    canCreateStudent: () => can('students:create'),
    canManageFamilyLinks: () => can('family:link'),
    canFamilyComment: () => can('family:comment'),
    canFamilyAcknowledge: () => can('family:acknowledge'),
    canViewAllStudents: () =>
      user?.role === 'admin_rede' ||
      user?.role === 'gestor_escolar' ||
      user?.role === 'coordenador',
    canCreateVersion: () => can('documents:create_version'),
    canCreateSchool: () => can('schools:create'),
  };
}
