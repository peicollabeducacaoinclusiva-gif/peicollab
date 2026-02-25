import { describe, it, expect } from 'vitest';
import { authorize, type AuthUser, type Permission, type Role } from './rbac';

const roles: Role[] = [
  'admin_rede',
  'gestor_escolar',
  'coordenador',
  'professor_regente',
  'professor_aee',
  'familia',
];

describe('authorize', () => {
  it('retorna false quando user é null', () => {
    expect(authorize(null, 'documents:create')).toBe(false);
    expect(authorize(null, 'users:manage')).toBe(false);
  });

  it('admin_rede tem todas as permissões de gestão', () => {
    const user: AuthUser = { id: '1', role: 'admin_rede' };
    expect(authorize(user, 'documents:create')).toBe(true);
    expect(authorize(user, 'documents:approve')).toBe(true);
    expect(authorize(user, 'templates:create')).toBe(true);
    expect(authorize(user, 'templates:edit')).toBe(true);
    expect(authorize(user, 'students:create')).toBe(true);
    expect(authorize(user, 'users:manage')).toBe(true);
    expect(authorize(user, 'family:link')).toBe(true);
    expect(authorize(user, 'schools:create')).toBe(true);
  });

  it('admin_rede não tem family:comment nem family:acknowledge', () => {
    const user: AuthUser = { id: '1', role: 'admin_rede' };
    expect(authorize(user, 'family:comment')).toBe(false);
    expect(authorize(user, 'family:acknowledge')).toBe(false);
  });

  it('gestor_escolar pode aprovar e criar aluno, não pode editar template nem criar escola', () => {
    const user: AuthUser = { id: '1', role: 'gestor_escolar' };
    expect(authorize(user, 'documents:approve')).toBe(true);
    expect(authorize(user, 'students:create')).toBe(true);
    expect(authorize(user, 'family:link')).toBe(true);
    expect(authorize(user, 'templates:edit')).toBe(false);
    expect(authorize(user, 'users:manage')).toBe(false);
    expect(authorize(user, 'schools:create')).toBe(false);
  });

  it('coordenador pode aprovar e criar versão, não pode criar aluno nem editar template', () => {
    const user: AuthUser = { id: '1', role: 'coordenador' };
    expect(authorize(user, 'documents:approve')).toBe(true);
    expect(authorize(user, 'documents:create_version')).toBe(true);
    expect(authorize(user, 'documents:archive')).toBe(true);
    expect(authorize(user, 'students:create')).toBe(false);
    expect(authorize(user, 'templates:edit')).toBe(false);
    expect(authorize(user, 'users:manage')).toBe(false);
  });

  it('professor_regente pode criar documento, não pode aprovar', () => {
    const user: AuthUser = { id: '1', role: 'professor_regente' };
    expect(authorize(user, 'documents:create')).toBe(true);
    expect(authorize(user, 'documents:edit')).toBe(true);
    expect(authorize(user, 'goals:create')).toBe(true);
    expect(authorize(user, 'documents:approve')).toBe(false);
    expect(authorize(user, 'students:create')).toBe(false);
  });

  it('familia pode comentar e dar ciência, não pode criar documento', () => {
    const user: AuthUser = { id: '1', role: 'familia' };
    expect(authorize(user, 'family:comment')).toBe(true);
    expect(authorize(user, 'family:acknowledge')).toBe(true);
    expect(authorize(user, 'documents:create')).toBe(false);
    expect(authorize(user, 'documents:approve')).toBe(false);
    expect(authorize(user, 'family:link')).toBe(false);
  });

  it('todas as permissões documents:* exceto approve para professores', () => {
    const prof: AuthUser = { id: '1', role: 'professor_regente' };
    expect(authorize(prof, 'documents:create')).toBe(true);
    expect(authorize(prof, 'documents:edit')).toBe(true);
    expect(authorize(prof, 'documents:create_version')).toBe(true);
    expect(authorize(prof, 'documents:archive')).toBe(false);
  });
});
