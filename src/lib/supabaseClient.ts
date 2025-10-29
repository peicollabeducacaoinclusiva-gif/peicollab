import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Criar cliente com configurações otimizadas para cache
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'pei-collab-v2.1'
    }
  }
});

// Função para forçar refresh do schema
export const refreshSchema = async () => {
  try {
    // Fazer uma query que força o Supabase a atualizar o cache
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'user_roles']);

    if (error) {
      console.error('Erro ao refresh schema:', error);
      return false;
    }

    console.log('Schema refreshado:', data);
    return true;
  } catch (error) {
    console.error('Erro ao refresh schema:', error);
    return false;
  }
};

// Função para testar a relação profiles -> user_roles
export const testUserRolesRelation = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        user_roles(role)
      `)
      .limit(1);

    if (error) {
      console.error('Erro na relação user_roles:', error);
      return false;
    }

    console.log('Relação user_roles funcionando:', data);
    return true;
  } catch (error) {
    console.error('Erro ao testar relação:', error);
    return false;
  }
};

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


