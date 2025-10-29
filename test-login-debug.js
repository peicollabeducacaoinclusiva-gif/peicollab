// Script para testar o login e debug do redirecionamento
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔍 Testando login...');
  
  // Testar login com diferentes usuários
  const testUsers = [
    { email: 'superadmin@example.com', password: 'validpassword', expectedRole: 'superadmin' },
    { email: 'coordinator@example.com', password: 'validpassword', expectedRole: 'coordinator' },
    { email: 'teacher@example.com', password: 'validpassword', expectedRole: 'teacher' },
    { email: 'school_director@example.com', password: 'validpassword', expectedRole: 'school_director' }
  ];

  for (const user of testUsers) {
    console.log(`\n🧪 Testando login para: ${user.email}`);
    
    try {
      // Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (authError) {
        console.error('❌ Erro de autenticação:', authError.message);
        continue;
      }

      console.log('✅ Login bem-sucedido');
      console.log('👤 User ID:', authData.user.id);

      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          tenant_id,
          school_id, 
          is_active,
          tenants(id, network_name),
          schools(id, school_name, tenant_id)
        `)
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Erro ao buscar profile:', profileError.message);
        continue;
      }

      console.log('👤 Profile encontrado:', profileData);

      // Buscar user_roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id);

      if (userRolesError) {
        console.error('❌ Erro ao buscar user_roles:', userRolesError.message);
      } else {
        console.log('🔑 User roles encontrados:', userRolesData);
      }

      // Testar função RPC
      const { data: rpcRole, error: rpcError } = await supabase
        .rpc('get_user_primary_role', { _user_id: authData.user.id });

      if (rpcError) {
        console.error('❌ Erro na função RPC:', rpcError.message);
      } else {
        console.log('🎯 Role via RPC:', rpcRole);
      }

      // Determinar role final
      let finalRole = 'teacher'; // padrão
      
      if (userRolesData && userRolesData.length > 0) {
        finalRole = userRolesData[0].role;
        console.log('✅ Role final (via user_roles):', finalRole);
      } else if (rpcRole) {
        finalRole = rpcRole;
        console.log('✅ Role final (via RPC):', finalRole);
      } else {
        console.log('⚠️ Usando role padrão:', finalRole);
      }

      // Verificar se o role está correto
      if (finalRole === user.expectedRole) {
        console.log('✅ Role correto!');
      } else {
        console.log('❌ Role incorreto! Esperado:', user.expectedRole, 'Encontrado:', finalRole);
      }

      // Fazer logout
      await supabase.auth.signOut();
      console.log('🚪 Logout realizado');

    } catch (error) {
      console.error('❌ Erro geral:', error.message);
    }
  }
}

testLogin().catch(console.error);
