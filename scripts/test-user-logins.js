// Script para testar login de todos os usuários especificados
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
  console.log('⚠️ Arquivo .env não encontrado, usando variáveis padrão');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lista de usuários para testar
const testUsers = [
  { 
    email: 'secretario.educacao@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'education_secretary',
    expectedName: 'Secretário de Educação'
  },
  { 
    email: 'coordenador@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'coordinator',
    expectedName: 'Maria Coordenadora'
  },
  { 
    email: 'gestor.escolar@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'school_manager',
    expectedName: 'Carlos Gestor Escolar'
  },
  { 
    email: 'professor.aee@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'aee_teacher',
    expectedName: 'Ana Professora AEE'
  },
  { 
    email: 'professor@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'teacher',
    expectedName: 'João Professor'
  },
  { 
    email: 'familia@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'family',
    expectedName: 'Pedro Família'
  },
  { 
    email: 'especialista@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'specialist',
    expectedName: 'Dr. Pedro Especialista'
  },
  { 
    email: 'diretor.escola@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'school_director',
    expectedName: 'Diretor da Escola'
  },
  { 
    email: 'profissional.apoio@teste.com', 
    password: 'Teste123!', 
    expectedRole: 'support_professional',
    expectedName: 'Profissional de Apoio'
  }
];

async function testUserLogins() {
  console.log('🔍 Testando logins de todos os usuários...\n');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const user of testUsers) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Testando: ${user.email}`);
    console.log(`   Nome esperado: ${user.expectedName}`);
    console.log(`   Role esperado: ${user.expectedRole}`);
    console.log(`${'='.repeat(80)}`);
    
    const result = {
      email: user.email,
      expectedName: user.expectedName,
      expectedRole: user.expectedRole,
      success: false,
      errors: []
    };

    try {
      // 1. Fazer logout antes de cada teste para garantir estado limpo
      await supabase.auth.signOut();

      // 2. Fazer login
      console.log('📝 Tentando fazer login...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (authError) {
        console.error('❌ Erro de autenticação:', authError.message);
        result.errors.push(`Erro de autenticação: ${authError.message}`);
        results.push(result);
        failureCount++;
        continue;
      }

      console.log('✅ Login bem-sucedido');
      console.log(`   👤 User ID: ${authData.user.id}`);
      console.log(`   📧 Email confirmado: ${authData.user.email_confirmed_at ? 'Sim' : 'Não'}`);

      // 3. Buscar perfil (dados básicos primeiro)
      console.log('\n📋 Buscando perfil...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name,
          email,
          tenant_id,
          school_id, 
          is_active,
          created_at
        `)
        .eq('id', authData.user.id)
        .maybeSingle();

      // Buscar dados relacionados separadamente
      let tenantData = null;
      let schoolData = null;
      
      if (!profileError && profileData) {
        if (profileData.tenant_id) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('id, network_name')
            .eq('id', profileData.tenant_id)
            .maybeSingle();
          tenantData = tenant;
        }
        
        if (profileData.school_id) {
          const { data: school } = await supabase
            .from('schools')
            .select('id, school_name, tenant_id')
            .eq('id', profileData.school_id)
            .maybeSingle();
          schoolData = school;
        }
      }

      if (profileError) {
        console.error('❌ Erro ao buscar profile:', profileError.message);
        result.errors.push(`Erro ao buscar perfil: ${profileError.message}`);
      } else if (!profileData) {
        console.error('❌ Perfil não encontrado');
        result.errors.push('Perfil não encontrado no banco de dados');
      } else {
        console.log('✅ Perfil encontrado:');
        console.log(`   Nome: ${profileData.full_name}`);
        console.log(`   Email: ${profileData.email || 'N/A'}`);
        console.log(`   Ativo: ${profileData.is_active ? 'Sim' : 'Não'}`);
        console.log(`   Tenant ID: ${profileData.tenant_id || 'N/A'}`);
        console.log(`   School ID: ${profileData.school_id || 'N/A'}`);
        
        if (tenantData) {
          console.log(`   Rede: ${tenantData.network_name || 'N/A'}`);
        }
        if (schoolData) {
          console.log(`   Escola: ${schoolData.school_name || 'N/A'}`);
        }

        // Verificar se o nome corresponde
        if (profileData.full_name !== user.expectedName) {
          console.warn(`⚠️ Nome não corresponde! Esperado: ${user.expectedName}, Encontrado: ${profileData.full_name}`);
          result.errors.push(`Nome não corresponde. Esperado: ${user.expectedName}, Encontrado: ${profileData.full_name}`);
        }

        // Verificar se está ativo
        if (!profileData.is_active) {
          console.warn('⚠️ Usuário está inativo');
          result.errors.push('Usuário está marcado como inativo');
        }
      }

      // 4. Buscar user_roles
      console.log('\n🔑 Buscando roles...');
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role, created_at')
        .eq('user_id', authData.user.id);

      if (userRolesError) {
        console.error('❌ Erro ao buscar user_roles:', userRolesError.message);
        result.errors.push(`Erro ao buscar roles: ${userRolesError.message}`);
      } else if (!userRolesData || userRolesData.length === 0) {
        console.error('❌ Nenhum role encontrado');
        result.errors.push('Nenhum role atribuído ao usuário');
      } else {
        const roles = userRolesData.map(r => r.role);
        console.log(`✅ Roles encontrados: ${roles.join(', ')}`);
        
        // Verificar se o role esperado está presente
        if (!roles.includes(user.expectedRole)) {
          console.error(`❌ Role esperado '${user.expectedRole}' não encontrado!`);
          result.errors.push(`Role esperado '${user.expectedRole}' não encontrado. Roles encontrados: ${roles.join(', ')}`);
        } else {
          console.log(`✅ Role esperado '${user.expectedRole}' confirmado`);
          result.actualRole = user.expectedRole;
        }
      }

      // 5. Testar função RPC get_user_primary_role
      console.log('\n🎯 Testando função RPC get_user_primary_role...');
      const { data: rpcRole, error: rpcError } = await supabase
        .rpc('get_user_primary_role', { _user_id: authData.user.id });

      if (rpcError) {
        console.error('❌ Erro na função RPC:', rpcError.message);
        result.errors.push(`Erro na função RPC: ${rpcError.message}`);
      } else {
        console.log(`✅ Role via RPC: ${rpcRole || 'N/A'}`);
        if (rpcRole && rpcRole !== user.expectedRole) {
          console.warn(`⚠️ Role via RPC diferente do esperado. Esperado: ${user.expectedRole}, RPC: ${rpcRole}`);
          result.errors.push(`Role via RPC diferente do esperado. Esperado: ${user.expectedRole}, RPC: ${rpcRole}`);
        }
      }

      // 6. Verificar se o usuário consegue acessar dados básicos
      console.log('\n🔍 Verificando acesso a dados...');
      try {
        const { data: userData, error: userDataError } = await supabase.auth.getUser();
        if (userDataError) {
          console.error('❌ Erro ao verificar sessão:', userDataError.message);
          result.errors.push(`Erro ao verificar sessão: ${userDataError.message}`);
        } else {
          console.log('✅ Sessão válida confirmada');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar dados do usuário:', error.message);
        result.errors.push(`Erro ao verificar dados: ${error.message}`);
      }

      // Determinar sucesso do teste
      if (result.errors.length === 0) {
        console.log('\n✅✅✅ TESTE PASSOU COM SUCESSO! ✅✅✅');
        result.success = true;
        successCount++;
      } else {
        console.log(`\n❌ TESTE FALHOU COM ${result.errors.length} ERRO(S)`);
        failureCount++;
      }

      // 7. Fazer logout
      console.log('\n🚪 Fazendo logout...');
      await supabase.auth.signOut();

    } catch (error) {
      console.error('\n❌ Erro geral no teste:', error.message);
      result.errors.push(`Erro geral: ${error.message}`);
      results.push(result);
      failureCount++;
    }

    results.push(result);
  }

  // Relatório final
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failureCount}`);
  console.log(`📝 Total: ${testUsers.length}\n`);

  // Detalhes das falhas
  if (failureCount > 0) {
    console.log('❌ USUÁRIOS COM FALHAS:\n');
    results.filter(r => !r.success).forEach(result => {
      console.log(`\n📧 ${result.email}`);
      console.log(`   Role esperado: ${result.expectedRole}`);
      result.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    });
  }

  // Resumo por usuário
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📋 RESUMO POR USUÁRIO');
  console.log(`${'='.repeat(80)}\n`);
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.email} - ${result.expectedName} (${result.expectedRole})`);
  });

  console.log(`\n${'='.repeat(80)}\n`);

  // Retornar código de saída apropriado
  if (failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testUserLogins().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

