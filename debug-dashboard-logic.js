// Script para debug específico da lógica do Dashboard
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para obter role principal com fallback (copiada do supabaseClient.ts)
const getUserPrimaryRole = async (userId) => {
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

async function debugDashboardLogic() {
  console.log('🔍 Debug da lógica do Dashboard...');
  
  try {
    // Simular login como coordenador
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coordinator@example.com',
      password: 'validpassword'
    });

    if (authError) {
      console.error('❌ Erro de autenticação:', authError.message);
      return;
    }

    console.log('✅ Login bem-sucedido');
    const userId = authData.user.id;
    console.log('👤 User ID:', userId);

    // Simular exatamente a lógica do Dashboard.tsx
    console.log('\n📋 1. Buscando profile...');
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id, 
        full_name, 
        tenant_id,
        school_id, 
        is_active,
        tenants(id, network_name),
        schools(id, school_name, tenant_id)
      `)
      .eq("id", userId)
      .maybeSingle();

    console.log('Profile data:', profileData);
    console.log('Profile error:', profileError);

    // 2b. Buscar user_roles separadamente (com fallback)
    console.log('\n🔑 2. Buscando user_roles...');
    let userRolesData = null;
    let userRolesError = null;
    
    try {
      const result = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      userRolesData = result.data;
      userRolesError = result.error;
      
      console.log('User roles data:', userRolesData);
      console.log('User roles error:', userRolesError);
      console.log('User roles data type:', typeof userRolesData);
      console.log('User roles data length:', userRolesData?.length);
      console.log('userRolesData && userRolesData.length > 0:', userRolesData && userRolesData.length > 0);
    } catch (error) {
      console.warn("⚠️ Erro ao buscar user_roles, usando fallback:", error.message);
      userRolesError = error;
    }

    // 3. Determinar o role final (exatamente como no Dashboard.tsx)
    console.log('\n🎯 3. Determinando role final...');
    let finalRole = 'teacher';
    
    console.log('Verificando condição: userRolesData && userRolesData.length > 0');
    console.log('userRolesData:', userRolesData);
    console.log('userRolesData.length:', userRolesData?.length);
    console.log('Condição result:', userRolesData && userRolesData.length > 0);
    
    if (userRolesData && userRolesData.length > 0) {
      // Usar o primeiro role encontrado
      finalRole = userRolesData[0].role;
      console.log("✅ Role encontrado em user_roles:", finalRole);
    } else {
      // Fallback: usar role baseado no ID do usuário ou padrão
      console.log("⚠️ user_roles não disponível, usando fallback...");
      
      // Tentar RPC primeiro
      try {
        const fallbackRole = await getUserPrimaryRole(userId);
        if (fallbackRole) {
          finalRole = fallbackRole;
          console.log("✅ Role via RPC:", finalRole);
        } else {
          throw new Error("RPC não disponível");
        }
      } catch (rpcError) {
        // Fallback final: usar role baseado no ID do usuário
        console.log("❌ RPC falhou:", rpcError.message);
        if (userId === '11111111-1111-1111-1111-111111111111') {
          finalRole = 'superadmin';
        } else if (userId === '22222222-2222-2222-2222-222222222222') {
          finalRole = 'coordinator';
        } else if (userId === '33333333-3333-3333-3333-333333333333') {
          finalRole = 'teacher';
        } else if (userId === '44444444-4444-4444-4444-444444444444') {
          finalRole = 'school_director';
        } else if (userId === '55555555-5555-5555-5555-555555555555') {
          finalRole = 'aee_teacher';
        } else {
          finalRole = 'teacher'; // Padrão
        }
        console.log("✅ Role via fallback ID:", finalRole);
      }
    }
    
    console.log("✅ Role final determinada:", finalRole);

    // Simular getPrimaryRole
    console.log('\n🎨 4. Simulando getPrimaryRole...');
    const profile = {
      id: profileData.id,
      full_name: profileData.full_name,
      user_roles: userRolesData || [{ role: finalRole }],
      tenant_id: profileData.tenant_id,
      school_id: profileData.school_id,
      is_active: profileData.is_active ?? false,
      network_name: profileData.tenants?.network_name,
      school_name: profileData.schools?.school_name,
    };

    const getPrimaryRole = (profile) => {
      return profile.user_roles?.[0]?.role || 'teacher';
    };

    const primaryRole = getPrimaryRole(profile);
    console.log("🎯 Role primário:", primaryRole);
    console.log("🎯 Profile user_roles:", profile.user_roles);

    // Logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugDashboardLogic().catch(console.error);
