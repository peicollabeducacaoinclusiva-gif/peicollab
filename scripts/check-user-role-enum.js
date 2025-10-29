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

async function checkUserRoleEnum() {
  console.log('🔍 Verificando valores válidos para user_role...\n');
  
  try {
    // 1. Verificar roles existentes na tabela profiles
    console.log('1. Verificando roles existentes na tabela profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role')
      .not('role', 'is', null);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }
    
    const uniqueRoles = [...new Set(profiles?.map(p => p.role) || [])];
    console.log('✅ Roles encontrados na tabela profiles:');
    uniqueRoles.forEach(role => {
      console.log(`   - ${role}`);
    });
    
    // 2. Verificar roles existentes na tabela user_roles
    console.log('\n2. Verificando roles existentes na tabela user_roles...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('role');
    
    if (userRolesError) {
      console.log('⚠️ Erro ao buscar user_roles:', userRolesError.message);
    } else {
      const uniqueUserRoles = [...new Set(userRoles?.map(ur => ur.role) || [])];
      console.log('✅ Roles encontrados na tabela user_roles:');
      uniqueUserRoles.forEach(role => {
        console.log(`   - ${role}`);
      });
    }
    
    // 3. Testar alguns valores comuns
    console.log('\n3. Testando valores comuns...');
    const testRoles = [
      'superadmin',
      'education_secretary',
      'school_director',
      'coordinator',
      'teacher',
      'aee_teacher',
      'specialist',
      'family'
    ];
    
    for (const testRole of testRoles) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', testRole)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${testRole}: ${error.message}`);
        } else {
          console.log(`✅ ${testRole}: Válido`);
        }
      } catch (err) {
        console.log(`❌ ${testRole}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserRoleEnum();


