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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileLoading() {
  console.log('🧪 Testando carregamento de perfil...\n');

  try {
    // 1. Verificar se há usuários na tabela profiles
    console.log('1. Verificando usuários na tabela profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, is_active')
      .limit(5);

    if (profilesError) {
      console.log('❌ Erro ao buscar profiles:', profilesError.message);
      return;
    }

    console.log(`✅ Encontrados ${profiles?.length || 0} profiles`);
    if (profiles && profiles.length > 0) {
      console.log('📋 Profiles encontrados:');
      profiles.forEach(p => {
        console.log(`   • ${p.full_name} (${p.id}) - Ativo: ${p.is_active}`);
      });
    }

    // 2. Verificar user_roles
    console.log('\n2. Verificando user_roles...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .limit(5);

    if (userRolesError) {
      console.log('❌ Erro ao buscar user_roles:', userRolesError.message);
    } else {
      console.log(`✅ Encontrados ${userRoles?.length || 0} user_roles`);
      if (userRoles && userRoles.length > 0) {
        console.log('📋 User roles encontrados:');
        userRoles.forEach(ur => {
          console.log(`   • ${ur.user_id} - Role: ${ur.role}`);
        });
      }
    }

    // 3. Testar query completa (como no Dashboard)
    console.log('\n3. Testando query completa do Dashboard...');
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      console.log(`🔍 Testando com usuário: ${testUserId}`);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          tenant_id,
          school_id, 
          is_active,
          user_roles(role),
          tenants(id, network_name),
          schools(id, school_name, tenant_id)
        `)
        .eq("id", testUserId)
        .maybeSingle();

      if (profileError) {
        console.log('❌ Erro na query completa:', profileError.message);
      } else {
        console.log('✅ Query completa funcionando!');
        console.log('📋 Dados do perfil:');
        console.log(`   • ID: ${profileData?.id}`);
        console.log(`   • Nome: ${profileData?.full_name}`);
        console.log(`   • Ativo: ${profileData?.is_active}`);
        console.log(`   • User Roles: ${JSON.stringify(profileData?.user_roles)}`);
        console.log(`   • Tenant ID: ${profileData?.tenant_id}`);
        console.log(`   • School ID: ${profileData?.school_id}`);
      }
    }

    // 4. Verificar se há problemas de RLS
    console.log('\n4. Verificando problemas de RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.log('❌ Problema de RLS detectado:', rlsError.message);
      if (rlsError.message.includes('infinite recursion')) {
        console.log('🔧 Solução: Execute o script fix-user-roles-rls.sql no Supabase Dashboard');
      }
    } else {
      console.log('✅ RLS funcionando corretamente');
    }

    console.log('\n🎉 Teste de carregamento de perfil concluído!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar teste
testProfileLoading();


