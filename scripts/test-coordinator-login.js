// Script para testar login da coordenadora
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCoordinatorLogin() {
  console.log('🔍 Testando login da coordenadora...\n');

  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coord.fernanda@escola.com',
      password: 'Teste123!'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('   User ID:', authData.user.id);

    // 2. Verificar perfil
    console.log('\n2. Verificando perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }

    console.log('✅ Perfil encontrado:', profile);

    // 3. Verificar roles
    console.log('\n3. Verificando roles...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData.user.id);

    if (rolesError) {
      console.error('❌ Erro ao buscar roles:', rolesError);
      return;
    }

    console.log('✅ Roles encontrados:', roles);

    // 4. Testar função RPC getUserPrimaryRole
    console.log('\n4. Testando função RPC getUserPrimaryRole...');
    const { data: primaryRole, error: rpcError } = await supabase
      .rpc('get_user_primary_role', { _user_id: authData.user.id });

    if (rpcError) {
      console.error('❌ Erro na RPC getUserPrimaryRole:', rpcError);
      return;
    }

    console.log('✅ Role primário via RPC:', primaryRole);

    // 5. Testar função RPC get_user_tenant_safe
    console.log('\n5. Testando função RPC get_user_tenant_safe...');
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_user_tenant_safe', { _user_id: authData.user.id });

    if (tenantError) {
      console.error('❌ Erro na RPC get_user_tenant_safe:', tenantError);
      return;
    }

    console.log('✅ Tenant ID via RPC:', tenantId);

    // 6. Testar função RPC get_user_school_id
    console.log('\n6. Testando função RPC get_user_school_id...');
    const { data: schoolId, error: schoolError } = await supabase
      .rpc('get_user_school_id', { _user_id: authData.user.id });

    if (schoolError) {
      console.error('❌ Erro na RPC get_user_school_id:', schoolError);
      return;
    }

    console.log('✅ School ID via RPC:', schoolId);

    // 7. Testar busca de dados da escola
    console.log('\n7. Testando busca de dados da escola...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
      .eq('school_id', schoolId);

    if (studentsError) {
      console.error('❌ Erro ao buscar alunos:', studentsError);
      return;
    }

    console.log('✅ Alunos encontrados:', students?.length || 0);

    console.log('\n🎉 Todos os testes passaram! O login da coordenadora está funcionando.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  testCoordinatorLogin();
}

export { testCoordinatorLogin };

