import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente do arquivo .env
try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️ Arquivo .env não encontrado, usando variáveis do sistema');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRpcFunctions() {
  console.log('🔍 Verificando funções RPC disponíveis...\n');
  
  try {
    // 1. Testar algumas funções RPC conhecidas
    console.log('1. Testando funções RPC conhecidas...');
    
    const rpcFunctions = [
      'get_user_primary_role',
      'get_user_school_id',
      'get_user_tenant_safe',
      'get_school_tenant_id',
      'user_has_school_access',
      'user_can_access_pei',
      'can_manage_network',
      'has_role',
      'create_user',
      'create-test-users'
    ];
    
    for (const funcName of rpcFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName, {});
        if (error) {
          console.log(`❌ ${funcName}: ${error.message}`);
        } else {
          console.log(`✅ ${funcName}: Disponível`);
        }
      } catch (err) {
        console.log(`❌ ${funcName}: ${err.message}`);
      }
    }
    
    // 2. Verificar se existe função para criar usuários
    console.log('\n2. Verificando funções de criação de usuários...');
    
    const createFunctions = [
      'create_user',
      'create-test-users',
      'create_test_users'
    ];
    
    for (const funcName of createFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName, {});
        if (error) {
          console.log(`❌ ${funcName}: ${error.message}`);
        } else {
          console.log(`✅ ${funcName}: Disponível`);
        }
      } catch (err) {
        console.log(`❌ ${funcName}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRpcFunctions();


