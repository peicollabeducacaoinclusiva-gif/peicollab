export type Role =
  | 'admin_rede'
  | 'gestor_escolar'
  | 'coordenador'
  | 'professor_regente'
  | 'professor_aee'
  | 'familia';

export type Permission =
  | 'documents:create'
  | 'documents:edit'
  | 'documents:approve'
  | 'documents:create_version'
  | 'documents:archive'
  | 'templates:create'
  | 'templates:edit'
  | 'students:create'
  | 'students:edit'
  | 'goals:create'
  | 'goals:update_progress'
  | 'family:comment'
  | 'family:acknowledge'
  | 'family:link'
  | 'users:manage'
  | 'schools:create';

export type AuthUser = {
  id: string;
  role: Role;
};

export const roleLabels: Record<Role, string> = {
  admin_rede: 'Admin Rede',
  gestor_escolar: 'Gestor Escolar',
  coordenador: 'Coordenador',
  professor_regente: 'Professor Regente',
  professor_aee: 'Professor AEE',
  familia: 'Família',
};

const permissionMatrix: Record<Permission, Role[]> = {
  'documents:create': ['admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee'],
  'documents:edit': ['admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee'],
  'documents:approve': ['admin_rede', 'gestor_escolar', 'coordenador'],
  'documents:create_version': [
    'admin_rede',
    'gestor_escolar',
    'coordenador',
    'professor_regente',
    'professor_aee',
  ],
  'documents:archive': ['admin_rede', 'gestor_escolar', 'coordenador'],
  'templates:create': ['admin_rede'],
  'templates:edit': ['admin_rede'],
  'students:create': ['admin_rede', 'gestor_escolar'],
  'students:edit': ['admin_rede', 'gestor_escolar'],
  'goals:create': ['admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee'],
  'goals:update_progress': ['admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee'],
  'family:comment': ['familia'],
  'family:acknowledge': ['familia'],
  'family:link': ['admin_rede', 'gestor_escolar'],
  'users:manage': ['admin_rede'],
  'schools:create': ['admin_rede'],
};

export function authorize(user: AuthUser | null, permission: Permission) {
  if (!user) return false;
  return permissionMatrix[permission].includes(user.role);
}
