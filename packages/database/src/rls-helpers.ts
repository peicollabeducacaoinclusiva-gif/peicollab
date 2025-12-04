import { supabase } from './client';
import type { AppRole } from './types';

/**
 * Verifica se o usuário tem um role específico
 */
export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: role,
  });

  if (error) {
    console.error('Erro ao verificar role:', error);
    return false;
  }

  return data || false;
}

/**
 * Verifica se o usuário pode acessar um PEI específico
 */
export async function userCanAccessPei(userId: string, peiId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_can_access_pei', {
    _user_id: userId,
    _pei_id: peiId,
  });

  if (error) {
    console.error('Erro ao verificar acesso ao PEI:', error);
    return false;
  }

  return data || false;
}

/**
 * Obtém o tenant_id do usuário
 */
export async function getUserTenantId(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_user_tenant_safe', {
    _user_id: userId,
  });

  if (error) {
    console.error('Erro ao obter tenant_id:', error);
    return null;
  }

  return data;
}

/**
 * Obtém o school_id do usuário
 */
export async function getUserSchoolId(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_user_school_id', {
    _user_id: userId,
  });

  if (error) {
    console.error('Erro ao obter school_id:', error);
    return null;
  }

  return data;
}

/**
 * Obtém o role primário do usuário
 */
export async function getUserPrimaryRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_user_primary_role', {
    _user_id: userId,
  });

  if (error) {
    console.error('Erro ao obter role primário:', error);
    return null;
  }

  return data;
}






