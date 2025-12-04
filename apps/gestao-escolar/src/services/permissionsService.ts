import { supabase } from '@pei/database';

/**
 * Tipos para o Sistema de Permissões
 */

export type PermissionAction = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'export' 
  | 'issue_document'
  | 'approve'
  | 'reject'
  | 'manage';

export type PermissionResource = 
  | 'student'
  | 'pei'
  | 'aee'
  | 'class'
  | 'enrollment'
  | 'document'
  | 'transfer'
  | 'occurrence'
  | 'ticket'
  | 'school'
  | 'network'
  | 'user'
  | 'dashboard'
  | 'report';

export type UserRole =
  | 'superadmin'
  | 'education_secretary'
  | 'school_director'
  | 'coordinator'
  | 'teacher'
  | 'aee_teacher'
  | 'specialist'
  | 'support_professional'
  | 'family'
  | 'student'
  | 'secretary';

export interface PermissionCheck {
  action: PermissionAction;
  resource: PermissionResource;
  resourceId?: string;
  schoolId?: string;
  tenantId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  role?: string;
}

/**
 * Serviço centralizado de Permissões
 */
export const permissionsService = {
  /**
   * Verificar permissão universal
   */
  async can(
    action: PermissionAction,
    resource: PermissionResource,
    options?: {
      resourceId?: string;
      schoolId?: string;
      tenantId?: string;
    }
  ): Promise<PermissionResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { allowed: false, reason: 'Usuário não autenticado' };
      }

      // Buscar role principal
      const { data: primaryRole } = await supabase.rpc('get_user_primary_role', {
        _user_id: user.id,
      });

      if (!primaryRole) {
        return { allowed: false, reason: 'Role não encontrado', role: null };
      }

      // Verificar permissão granular se disponível
      if (options?.resourceId) {
        try {
          const { data: hasGranularPermission, error } = await supabase.rpc('has_permission', {
            p_user_id: user.id,
            p_permission: `${action}_${resource}`,
            p_resource_type: resource,
            p_resource_id: options.resourceId || null,
          });

          if (!error && hasGranularPermission) {
            return { allowed: true, role: primaryRole };
          }
        } catch (err) {
          // Fallback para verificação por role se RPC falhar
          console.warn('Erro ao verificar permissão granular, usando fallback:', err);
        }
      }

      // Fallback para verificação por role
      const result = this.checkByRole(primaryRole, action, resource, options);
      return { ...result, role: primaryRole };
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return { allowed: false, reason: (error as Error).message };
    }
  },

  /**
   * Verificar permissão por role (fallback)
   */
  checkByRole(
    role: string,
    action: PermissionAction,
    resource: PermissionResource,
    options?: {
      resourceId?: string;
      schoolId?: string;
      tenantId?: string;
    }
  ): PermissionResult {
    // Superadmin tem acesso total
    if (role === 'superadmin') {
      return { allowed: true };
    }

    // Matriz de permissões por role
    const permissions: Record<UserRole, Record<PermissionResource, PermissionAction[]>> = {
      superadmin: {
        student: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        pei: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'reject', 'manage'],
        aee: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        class: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        enrollment: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        document: ['view', 'create', 'edit', 'delete', 'export', 'issue_document', 'manage'],
        transfer: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        occurrence: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        ticket: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        school: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        network: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        user: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
        dashboard: ['view', 'export'],
        report: ['view', 'create', 'export'],
      },
      education_secretary: {
        student: ['view', 'export'],
        pei: ['view', 'approve', 'reject', 'export'],
        aee: ['view', 'export'],
        class: ['view', 'create', 'edit', 'export'],
        enrollment: ['view', 'create', 'edit', 'export'],
        document: ['view', 'issue_document', 'export'],
        transfer: ['view', 'create', 'edit', 'export'],
        occurrence: ['view', 'export'],
        ticket: ['view', 'create', 'edit', 'export'],
        school: ['view', 'create', 'edit'],
        network: ['view', 'manage'],
        user: ['view', 'create', 'edit'],
        dashboard: ['view', 'export'],
        report: ['view', 'create', 'export'],
      },
      school_director: {
        student: ['view', 'create', 'edit', 'export'],
        pei: ['view', 'approve', 'reject', 'export'],
        aee: ['view', 'export'],
        class: ['view', 'create', 'edit', 'delete'],
        enrollment: ['view', 'create', 'edit'],
        document: ['view', 'issue_document', 'export'],
        transfer: ['view', 'create', 'edit'],
        occurrence: ['view', 'create', 'edit'],
        ticket: ['view', 'create', 'edit'],
        school: ['view', 'edit', 'manage'],
        network: ['view'],
        user: ['view', 'create', 'edit'],
        dashboard: ['view'],
        report: ['view', 'create', 'export'],
      },
      coordinator: {
        student: ['view', 'edit', 'export'],
        pei: ['view', 'create', 'edit', 'approve', 'reject', 'export'],
        aee: ['view', 'export'],
        class: ['view'],
        enrollment: ['view'],
        document: ['view', 'export'],
        transfer: ['view'],
        occurrence: ['view', 'create', 'edit'],
        ticket: ['view', 'create'],
        school: ['view'],
        network: ['view'],
        user: ['view'],
        dashboard: ['view'],
        report: ['view', 'create', 'export'],
      },
      teacher: {
        student: ['view'],
        pei: ['view', 'create', 'edit'],
        aee: ['view'],
        class: ['view', 'edit'],
        enrollment: ['view'],
        document: ['view'],
        transfer: ['view'],
        occurrence: ['view', 'create'],
        ticket: ['view', 'create'],
        school: ['view'],
        network: [],
        user: [],
        dashboard: ['view'],
        report: ['view'],
      },
      aee_teacher: {
        student: ['view'],
        pei: ['view'],
        aee: ['view', 'create', 'edit'],
        class: ['view'],
        enrollment: ['view'],
        document: ['view'],
        transfer: ['view'],
        occurrence: ['view', 'create'],
        ticket: ['view', 'create'],
        school: ['view'],
        network: [],
        user: [],
        dashboard: ['view'],
        report: ['view'],
      },
      specialist: {
        student: ['view'],
        pei: ['view'],
        aee: ['view'],
        class: ['view'],
        enrollment: ['view'],
        document: ['view'],
        transfer: ['view'],
        occurrence: ['view'],
        ticket: ['view'],
        school: ['view'],
        network: [],
        user: [],
        dashboard: ['view'],
        report: ['view'],
      },
      support_professional: {
        student: ['view'],
        pei: ['view'],
        aee: ['view'],
        class: ['view'],
        enrollment: ['view'],
        document: ['view'],
        transfer: ['view'],
        occurrence: ['view', 'create'],
        ticket: ['view', 'create'],
        school: ['view'],
        network: [],
        user: [],
        dashboard: ['view'],
        report: [],
      },
      secretary: {
        student: ['view', 'edit'],
        pei: ['view'],
        aee: ['view'],
        class: ['view'],
        enrollment: ['view', 'create', 'edit'],
        document: ['view', 'create', 'edit', 'issue_document'],
        transfer: ['view', 'create', 'edit'],
        occurrence: ['view', 'create', 'edit'],
        ticket: ['view', 'create', 'edit'],
        school: ['view'],
        network: [],
        user: ['view'],
        dashboard: ['view'],
        report: ['view', 'create'],
      },
      family: {
        student: ['view'],
        pei: ['view'],
        aee: ['view'],
        class: ['view'],
        enrollment: ['view'],
        document: ['view'],
        transfer: [],
        occurrence: [],
        ticket: ['view', 'create'],
        school: ['view'],
        network: [],
        user: [],
        dashboard: [],
        report: [],
      },
      student: {
        student: ['view'],
        pei: ['view'],
        aee: [],
        class: ['view'],
        enrollment: ['view'],
        document: ['view'],
        transfer: [],
        occurrence: [],
        ticket: ['view', 'create'],
        school: ['view'],
        network: [],
        user: [],
        dashboard: [],
        report: [],
      },
    };

    const rolePermissions = permissions[role as UserRole];
    if (!rolePermissions) {
      return { allowed: false, reason: `Role '${role}' não reconhecido` };
    }

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions || resourcePermissions.length === 0) {
      return { allowed: false, reason: `Role '${role}' não tem acesso a '${resource}'` };
    }

    const hasPermission = resourcePermissions.includes(action);
    return {
      allowed: hasPermission,
      reason: hasPermission ? undefined : `Role '${role}' não tem permissão '${action}' em '${resource}'`,
    };
  },

  /**
   * Verificar múltiplas permissões
   */
  async canAll(checks: PermissionCheck[]): Promise<PermissionResult[]> {
    return Promise.all(
      checks.map((check) =>
        this.can(check.action, check.resource, {
          resourceId: check.resourceId,
          schoolId: check.schoolId,
          tenantId: check.tenantId,
        })
      )
    );
  },

  /**
   * Verificar se tem pelo menos uma permissão
   */
  async canAny(checks: PermissionCheck[]): Promise<PermissionResult> {
    const results = await this.canAll(checks);
    const allowed = results.some((r) => r.allowed);
    return {
      allowed,
      reason: allowed ? undefined : 'Nenhuma permissão foi concedida',
    };
  },
};

