// Script para testar todos os dashboards do sistema
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

console.log('🔍 Testando todos os dashboards do sistema...\n');
console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

// Lista de dashboards para testar com suas credenciais
const dashboards = [
  {
    name: 'CoordinatorDashboard',
    role: 'coordinator',
    email: 'coordenador@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'CoordinatorDashboard'
  },
  {
    name: 'TeacherDashboard',
    role: 'teacher',
    email: 'professor@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'TeacherDashboard'
  },
  {
    name: 'AEETeacherDashboard',
    role: 'aee_teacher',
    email: 'professor.aee@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'AEETeacherDashboard'
  },
  {
    name: 'SchoolManagerDashboard',
    role: 'school_manager',
    email: 'gestor.escolar@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'SchoolManagerDashboard'
  },
  {
    name: 'SchoolDirectorDashboard',
    role: 'school_director',
    email: 'diretor.escola@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'SchoolDirectorDashboard'
  },
  {
    name: 'EducationSecretaryDashboard',
    role: 'education_secretary',
    email: 'secretario.educacao@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'EducationSecretaryDashboard'
  },
  {
    name: 'SpecialistDashboard',
    role: 'specialist',
    email: 'especialista@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'SpecialistDashboard'
  },
  {
    name: 'SupportProfessionalDashboard',
    role: 'support_professional',
    email: 'profissional.apoio@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'SupportProfessionalDashboard'
  },
  {
    name: 'FamilyDashboard',
    role: 'family',
    email: 'familia@teste.com',
    password: 'Teste123!',
    dashboardComponent: 'FamilyDashboard'
  }
];

async function testDashboard(dashboard) {
  const results = {
    dashboardName: dashboard.name,
    role: dashboard.role,
    email: dashboard.email,
    login: false,
    profileLoaded: false,
    dataLoaded: false,
    statsLoaded: false,
    errors: []
  };

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTANDO: ${dashboard.name.toUpperCase()}`);
    console.log(`${'='.repeat(80)}\n`);

    // 1. Login
    console.log(`1️⃣ Fazendo login como ${dashboard.role}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: dashboard.email,
      password: dashboard.password
    });

    if (authError) {
      console.error(`   ❌ Erro ao fazer login: ${authError.message}`);
      results.errors.push(`Erro ao fazer login: ${authError.message}`);
      return results;
    }

    console.log(`   ✅ Login realizado com sucesso`);
    console.log(`   User ID: ${authData.user.id}`);
    results.login = true;

    // 2. Buscar perfil
    console.log(`\n2️⃣ Buscando perfil...`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, tenant_id, school_id, is_active')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error(`   ❌ Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`);
      results.errors.push(`Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`);
      await supabase.auth.signOut();
      return results;
    }

    console.log(`   ✅ Perfil encontrado:`);
    console.log(`      Nome: ${profileData.full_name}`);
    console.log(`      Tenant ID: ${profileData.tenant_id || 'N/A'}`);
    console.log(`      School ID: ${profileData.school_id || 'N/A'}`);
    console.log(`      Ativo: ${profileData.is_active ? 'Sim' : 'Não'}`);
    results.profileLoaded = true;

    // 3. Buscar roles do usuário
    console.log(`\n3️⃣ Verificando roles do usuário...`);
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id);

    if (rolesError) {
      console.warn(`   ⚠️ Erro ao buscar roles: ${rolesError.message}`);
      results.errors.push(`Erro ao buscar roles: ${rolesError.message}`);
    } else {
      const roles = rolesData?.map(r => r.role) || [];
      console.log(`   ✅ Roles encontrados: ${roles.join(', ')}`);
      
      if (!roles.includes(dashboard.role)) {
        console.warn(`   ⚠️ Role esperado '${dashboard.role}' não encontrado nos roles do usuário`);
        results.errors.push(`Role esperado '${dashboard.role}' não encontrado`);
      }
    }

    // 4. Testar carregamento de dados específicos do dashboard
    console.log(`\n4️⃣ Testando carregamento de dados do dashboard...`);
    
    let dataLoadedSuccess = false;
    
    switch (dashboard.role) {
      case 'coordinator':
        // Testar dados do coordenador
        const { data: coordinatorPeis } = await supabase
          .from('peis')
          .select('id, status, created_at')
          .eq('is_active_version', true);
        
        const { data: coordinatorStudents } = await supabase
          .from('students')
          .select('id, name')
          .eq('is_active', true);
        
        if (!coordinatorPeis || !coordinatorStudents) {
          results.errors.push('Erro ao carregar dados do coordenador');
        } else {
          console.log(`   ✅ PEIs encontrados: ${coordinatorPeis.length}`);
          console.log(`   ✅ Alunos encontrados: ${coordinatorStudents.length}`);
          dataLoadedSuccess = true;
        }
        break;
        
      case 'teacher':
      case 'aee_teacher':
        // Testar dados do professor
        const { data: teacherPeis } = await supabase
          .from('peis')
          .select('id, status, student_id, assigned_teacher_id')
          .eq('is_active_version', true)
          .or(`assigned_teacher_id.eq.${authData.user.id},created_by.eq.${authData.user.id}`);
        
        if (!teacherPeis) {
          results.errors.push('Erro ao carregar PEIs do professor');
        } else {
          console.log(`   ✅ PEIs do professor encontrados: ${teacherPeis.length}`);
          dataLoadedSuccess = true;
        }
        break;
        
      case 'school_manager':
      case 'school_director':
        // Testar dados do gestor/diretor
        const { data: managerPeis } = await supabase
          .from('peis')
          .select('id, status')
          .eq('is_active_version', true);
        
        const { data: managerStudents } = await supabase
          .from('students')
          .select('id, name')
          .eq('is_active', true);
        
        if (!managerPeis || !managerStudents) {
          results.errors.push('Erro ao carregar dados do gestor/diretor');
        } else {
          console.log(`   ✅ PEIs encontrados: ${managerPeis.length}`);
          console.log(`   ✅ Alunos encontrados: ${managerStudents.length}`);
          dataLoadedSuccess = true;
        }
        break;
        
      case 'education_secretary':
        // Testar dados do secretário
        const { data: secretaryTenants } = await supabase
          .from('tenants')
          .select('id, network_name');
        
        const { data: secretarySchools } = await supabase
          .from('schools')
          .select('id, school_name');
        
        if (!secretaryTenants || !secretarySchools) {
          results.errors.push('Erro ao carregar dados do secretário');
        } else {
          console.log(`   ✅ Redes encontradas: ${secretaryTenants.length}`);
          console.log(`   ✅ Escolas encontradas: ${secretarySchools.length}`);
          dataLoadedSuccess = true;
        }
        break;
        
      case 'specialist':
        // Testar dados do especialista
        const { data: specialistPeis } = await supabase
          .from('peis')
          .select('id, status, student_id')
          .eq('is_active_version', true);
        
        if (!specialistPeis) {
          results.errors.push('Erro ao carregar PEIs do especialista');
        } else {
          console.log(`   ✅ PEIs encontrados: ${specialistPeis.length}`);
          dataLoadedSuccess = true;
        }
        break;
        
      case 'support_professional':
        // Testar dados do profissional de apoio
        const { data: supportPeis } = await supabase
          .from('peis')
          .select('id, status, student_id')
          .eq('is_active_version', true);
        
        if (!supportPeis) {
          results.errors.push('Erro ao carregar PEIs do profissional de apoio');
        } else {
          console.log(`   ✅ PEIs encontrados: ${supportPeis.length}`);
          dataLoadedSuccess = true;
        }
        break;
        
      case 'family':
        // Testar dados da família
        const { data: familyTokens } = await supabase
          .from('family_access_tokens')
          .select('id, pei_id, expires_at')
          .eq('used', false);
        
        if (!familyTokens) {
          results.errors.push('Erro ao carregar tokens da família');
        } else {
          console.log(`   ✅ Tokens encontrados: ${familyTokens.length}`);
          dataLoadedSuccess = true;
        }
        break;
        
      default:
        console.log(`   ⚠️ Dashboard não implementado para role: ${dashboard.role}`);
        dataLoadedSuccess = true; // Não é erro, apenas não implementado
    }

    results.dataLoaded = dataLoadedSuccess;

    // 5. Testar carregamento de estatísticas (se aplicável)
    console.log(`\n5️⃣ Testando carregamento de estatísticas...`);
    
    if (['coordinator', 'school_manager', 'school_director', 'education_secretary'].includes(dashboard.role)) {
      const { data: statsPeis } = await supabase
        .from('peis')
        .select('status')
        .eq('is_active_version', true);
      
      if (statsPeis) {
        const stats = {
          total: statsPeis.length,
          draft: statsPeis.filter(p => p.status === 'draft').length,
          pending: statsPeis.filter(p => p.status === 'pending' || p.status === 'pending_validation').length,
          approved: statsPeis.filter(p => p.status === 'approved').length,
          returned: statsPeis.filter(p => p.status === 'returned').length
        };
        
        console.log(`   ✅ Estatísticas calculadas:`);
        console.log(`      Total: ${stats.total}`);
        console.log(`      Rascunho: ${stats.draft}`);
        console.log(`      Pendente: ${stats.pending}`);
        console.log(`      Aprovado: ${stats.approved}`);
        console.log(`      Devolvido: ${stats.returned}`);
        results.statsLoaded = true;
      } else {
        results.errors.push('Erro ao calcular estatísticas');
      }
    } else {
      console.log(`   ⚠️ Estatísticas não aplicáveis para este dashboard`);
      results.statsLoaded = true; // Não é erro, apenas não aplicável
    }

    // Logout
    await supabase.auth.signOut();
    console.log(`\n   ✅ Teste do ${dashboard.name} concluído`);

    return results;

  } catch (error) {
    console.error(`\n   ❌ Erro ao testar dashboard: ${error.message}`);
    results.errors.push(`Erro geral: ${error.message}`);
    await supabase.auth.signOut();
    return results;
  }
}

// Executar testes de todos os dashboards
async function testAllDashboards() {
  const allResults = [];
  let successCount = 0;
  let failureCount = 0;

  for (const dashboard of dashboards) {
    const result = await testDashboard(dashboard);
    allResults.push(result);
    
    const isSuccess = result.login && result.profileLoaded && result.dataLoaded && result.errors.length === 0;
    if (isSuccess) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Relatório final
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL - TESTE DE TODOS OS DASHBOARDS');
  console.log('='.repeat(80) + '\n');

  allResults.forEach((result, index) => {
    const status = result.login && result.profileLoaded && result.dataLoaded && result.errors.length === 0 ? '✅' : '❌';
    console.log(`${status} ${result.dashboardName} (${result.role})`);
    console.log(`   Email: ${result.email}`);
    console.log(`   Login: ${result.login ? '✅' : '❌'}`);
    console.log(`   Perfil: ${result.profileLoaded ? '✅' : '❌'}`);
    console.log(`   Dados: ${result.dataLoaded ? '✅' : '❌'}`);
    console.log(`   Estatísticas: ${result.statsLoaded ? '✅' : '❌'}`);
    
    if (result.errors.length > 0) {
      console.log(`   Erros: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`      • ${error}`);
      });
    }
    console.log('');
  });

  console.log('='.repeat(80));
  console.log(`\n📈 RESUMO:`);
  console.log(`   ✅ Sucessos: ${successCount}`);
  console.log(`   ❌ Falhas: ${failureCount}`);
  console.log(`   📊 Total: ${allResults.length}`);
  console.log(`   📈 Taxa de sucesso: ${((successCount / allResults.length) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(80) + '\n');

  return allResults;
}

// Executar testes
testAllDashboards().then((results) => {
  const allSuccess = results.every(r => r.login && r.profileLoaded && r.dataLoaded && r.errors.length === 0);
  process.exit(allSuccess ? 0 : 1);
});

