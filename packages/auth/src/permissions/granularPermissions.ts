import { supabase } from '@pei/database';

export type Permission = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'return';
export type ResourceType = 'student' | 'class' | 'pei' | 'aee' | 'diary' | 'grade' | 'planning' | 'report' | 'document';
export type Role = 'secretary' | 'coordination' | 'teacher' | 'aee' | 'director' | 'family';

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
}

/**
 * Verifica se o usuário tem uma permissão específica
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  resourceType?: ResourceType,
  resourceId?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_permission', {
      p_user_id: userId,
      p_permission: permission,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
    });

    if (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }

    return data ?? false;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * Verifica múltiplas permissões de uma vez
 */
export async function hasPermissions(
  userId: string,
  checks: Array<{
    permission: Permission;
    resourceType?: ResourceType;
    resourceId?: string;
  }>
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  await Promise.all(
    checks.map(async (check) => {
      const key = `${check.permission}_${check.resourceType || 'global'}_${check.resourceId || 'all'}`;
      results[key] = await hasPermission(
        userId,
        check.permission,
        check.resourceType,
        check.resourceId
      );
    })
  );

  return results;
}

/**
 * Verifica se um campo de dados deve ser visível para um papel (LGPD)
 */
export async function isDataFieldVisible(
  role: Role,
  dataField: string
): Promise<{ visible: boolean; masked: boolean; maskPattern?: string }> {
  try {
    const { data, error } = await supabase
      .from('lgpd_data_visibility')
      .select('visible, masked, mask_pattern')
      .eq('role', role)
      .eq('data_field', dataField)
      .single();

    if (error || !data) {
      // Por padrão, se não houver configuração, permitir visibilidade
      return { visible: true, masked: false };
    }

    return {
      visible: data.visible ?? true,
      masked: data.masked ?? false,
      maskPattern: data.mask_pattern || undefined,
    };
  } catch (error) {
    console.error('Erro ao verificar visibilidade de campo:', error);
    return { visible: true, masked: false };
  }
}

/**
 * Aplica máscara a um valor conforme configuração LGPD
 */
export function maskData(value: string, maskPattern?: string): string {
  if (!maskPattern) return value;

  // Implementação simples de máscara
  // Padrões como '***.***.***-**' para CPF
  const chars = value.split('');
  let patternIndex = 0;
  let result = '';

  for (let i = 0; i < maskPattern.length; i++) {
    if (maskPattern[i] === '*') {
      if (patternIndex < chars.length) {
        result += chars[patternIndex];
        patternIndex++;
      } else {
        result += '*';
      }
    } else {
      result += maskPattern[i];
    }
  }

  return result;
}

/**
 * Verifica se usuário pode acessar um recurso específico
 */
export async function canAccessResource(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  permission: Permission = 'view'
): Promise<PermissionCheck> {
  const hasAccess = await hasPermission(userId, permission, resourceType, resourceId);

  if (!hasAccess) {
    return {
      hasPermission: false,
      reason: `Usuário não tem permissão ${permission} para ${resourceType}`,
    };
  }

  return { hasPermission: true };
}

/**
 * Verifica se usuário pode acessar recursos de uma turma
 */
export async function canAccessClass(
  userId: string,
  classId: string,
  permission: Permission = 'view'
): Promise<PermissionCheck> {
  // Verificar se é professor da turma
  const { data: teacherClass } = await supabase
    .from('class_teachers')
    .select('teacher_id')
    .eq('class_id', classId)
    .eq('teacher_id', userId)
    .single();

  if (teacherClass) {
    return { hasPermission: true };
  }

  // Verificar permissão geral
  return await canAccessResource(userId, 'class', classId, permission);
}

/**
 * Verifica se usuário pode acessar dados de um aluno
 */
export async function canAccessStudent(
  userId: string,
  studentId: string,
  permission: Permission = 'view'
): Promise<PermissionCheck> {
  // Verificar permissão específica
  const hasAccess = await hasPermission(userId, permission, 'student', studentId);

  if (hasAccess) {
    return { hasPermission: true };
  }

  // Verificar se é professor de turma do aluno
  const { data: enrollment } = await supabase
    .from('student_enrollments')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .single();

  if (enrollment) {
    const classAccess = await canAccessClass(userId, enrollment.class_id, permission);
    if (classAccess.hasPermission) {
      return { hasPermission: true };
    }
  }

  return {
    hasPermission: false,
    reason: `Usuário não tem permissão ${permission} para acessar este aluno`,
  };
}

