// Reutiliza o único cliente Supabase da aplicação para evitar múltiplas instâncias
import { supabase } from "@/integrations/supabase/client";

// Re-exportar supabase para compatibilidade com imports existentes
export { supabase };

// Função para forçar refresh do schema
// Evita chamadas ao information_schema via REST (não suportado pelo PostgREST)
// Mantido como no-op para compatibilidade com chamadas existentes
export const refreshSchema = async () => true;

// Função para testar a relação profiles -> user_roles
// Evita selects com relação indireta que quebram o cache do PostgREST
// Mantido como no-op para compatibilidade com chamadas existentes
export const testUserRolesRelation = async () => true;

// Função para obter role principal com fallback
export const getUserPrimaryRole = async (userId: string) => {
  try {
    // Tentar usar a função RPC
    const { data: rpcRole, error: rpcError } = await supabase
      .rpc('get_user_primary_role', { _user_id: userId });

    if (!rpcError && rpcRole) {
      return rpcRole;
    }

    // Fallback: buscar diretamente da tabela
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('role')
      .limit(1);

    if (rolesError) {
      console.error('Erro ao buscar role:', rolesError);
      return 'teacher'; // Role padrão
    }

    return userRoles?.[0]?.role || 'teacher';
  } catch (error) {
    console.error('Erro ao obter role principal:', error);
    return 'teacher';
  }
};

export default supabase;


