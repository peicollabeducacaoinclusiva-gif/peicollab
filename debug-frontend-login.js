// Script para debug específico do frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugFrontendLogin() {
  console.log('🔍 Debug do login do frontend...');
  
  try {
    // Simular login como no frontend
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coordinator@example.com',
      password: 'validpassword'
    });

    if (authError) {
      console.error('❌ Erro de autenticação:', authError.message);
      return;
    }

    console.log('✅ Login bem-sucedido');
    console.log('👤 User ID:', authData.user.id);

    // Simular exatamente o que o Dashboard.tsx faz
    const userId = authData.user.id;

    // 1. Buscar dados básicos do profile
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

    // 2. Buscar user_roles separadamente (como no código)
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
    } catch (error) {
      console.warn("⚠️ Erro ao buscar user_roles:", error.message);
      userRolesError = error;
    }

    // 3. Determinar role final (como no código)
    console.log('\n🎯 3. Determinando role final...');
    let finalRole = 'teacher';
    
    if (userRolesData && userRolesData.length > 0) {
      finalRole = userRolesData[0].role;
      console.log("✅ Role encontrado em user_roles:", finalRole);
    } else {
      console.log("⚠️ user_roles não disponível, usando fallback...");
      
      // Tentar RPC
      try {
        const { data: rpcRole, error: rpcError } = await supabase
          .rpc('get_user_primary_role', { _user_id: userId });
        
        if (!rpcError && rpcRole) {
          finalRole = rpcRole;
          console.log("✅ Role via RPC:", finalRole);
        } else {
          console.log("❌ RPC error:", rpcError);
          throw new Error("RPC não disponível");
        }
      } catch (rpcError) {
        console.log("❌ RPC falhou:", rpcError.message);
        finalRole = 'teacher'; // Padrão
        console.log("✅ Role via fallback ID:", finalRole);
      }
    }
    
    console.log("✅ Role final determinada:", finalRole);

    // 4. Simular getPrimaryRole
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

    // 5. Simular renderização do dashboard
    console.log('\n🏠 5. Simulando renderização do dashboard...');
    switch (primaryRole) {
      case "superadmin":
        console.log("✅ Renderizando SuperadminDashboard");
        break;
      case "education_secretary":
        console.log("✅ Renderizando EducationSecretaryDashboard");
        break;
      case "school_director":
        console.log("✅ Renderizando SchoolDirectorDashboard");
        break;
      case "coordinator":
        console.log("✅ Renderizando CoordinatorDashboard");
        break;
      case "teacher":
        console.log("✅ Renderizando TeacherDashboard");
        break;
      case "family":
        console.log("✅ Renderizando FamilyDashboard");
        break;
      case "school_manager":
        console.log("✅ Renderizando SchoolManagerDashboard");
        break;
      case "aee_teacher":
        console.log("✅ Renderizando AEETeacherDashboard");
        break;
      case "specialist":
        console.log("✅ Renderizando SpecialistDashboard");
        break;
      default:
        console.log("❌ Role não reconhecida:", primaryRole);
    }

    // Logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugFrontendLogin().catch(console.error);
