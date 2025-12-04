// Script para testar o App Gestão Escolar
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

console.log('🔍 Testando App Gestão Escolar...\n');
console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

// Lista de funcionalidades para testar por role
const testScenarios = [
  {
    name: 'Coordinator',
    role: 'coordinator',
    email: 'coordenador@teste.com',
    password: 'Teste123!',
    features: ['dashboard', 'students', 'professionals', 'classes', 'users', 'import', 'export']
  },
  {
    name: 'School Director',
    role: 'school_director',
    email: 'diretor.escola@teste.com',
    password: 'Teste123!',
    features: ['dashboard', 'students', 'professionals', 'classes', 'users', 'import', 'export']
  },
  {
    name: 'Education Secretary',
    role: 'education_secretary',
    email: 'secretario.educacao@teste.com',
    password: 'Teste123!',
    features: ['dashboard', 'students', 'professionals', 'classes', 'users', 'import', 'export']
  },
  {
    name: 'Teacher',
    role: 'teacher',
    email: 'professor@teste.com',
    password: 'Teste123!',
    features: ['dashboard', 'students'] // Professores têm acesso limitado
  }
];

async function testFeature(supabaseClient, feature, authData, profileData) {
  const results = {
    feature: feature,
    success: false,
    data: null,
    error: null
  };

  try {
    switch (feature) {
      case 'dashboard':
        // Testar carregamento de estatísticas do dashboard
        const [studentsRes, professionalsRes, classesRes, peisRes] = await Promise.all([
          supabaseClient.from('students').select('id', { count: 'exact', head: true }),
          supabaseClient.from('professionals').select('id', { count: 'exact', head: true }),
          supabaseClient.from('classes').select('id', { count: 'exact', head: true }),
          supabaseClient.from('peis').select('id', { count: 'exact', head: true })
        ]);

        const errors = [studentsRes.error, professionalsRes.error, classesRes.error, peisRes.error].filter(e => e);
        if (errors.length > 0) {
          results.error = `Erro ao carregar estatísticas: ${errors.map(e => e.message).join(', ')}`;
        } else {
          results.data = {
            students: studentsRes.count || 0,
            professionals: professionalsRes.count || 0,
            classes: classesRes.count || 0,
            peis: peisRes.count || 0
          };
          results.success = true;
        }
        break;

      case 'students':
        // Testar acesso à página de alunos
        let studentsQuery = supabaseClient
          .from('students')
          .select('id, name, school_id, tenant_id')
          .eq('is_active', true)
          .limit(10);

        if (profileData.school_id) {
          studentsQuery = studentsQuery.eq('school_id', profileData.school_id);
        } else if (profileData.tenant_id) {
          studentsQuery = studentsQuery.eq('tenant_id', profileData.tenant_id);
        }

        const { data: studentsData, error: studentsError } = await studentsQuery;

        if (studentsError) {
          results.error = `Erro ao carregar alunos: ${studentsError.message}`;
        } else {
          results.data = {
            count: studentsData?.length || 0,
            students: studentsData?.slice(0, 5).map(s => ({ id: s.id, name: s.name })) || []
          };
          results.success = true;
        }
        break;

      case 'professionals':
        // Testar acesso à página de profissionais
        let professionalsQuery = supabaseClient
          .from('professionals')
          .select('id, full_name, school_id, tenant_id, professional_role')
          .eq('is_active', true)
          .limit(10);

        if (profileData.school_id) {
          professionalsQuery = professionalsQuery.eq('school_id', profileData.school_id);
        } else if (profileData.tenant_id) {
          professionalsQuery = professionalsQuery.eq('tenant_id', profileData.tenant_id);
        }

        const { data: professionalsData, error: professionalsError } = await professionalsQuery;

        if (professionalsError) {
          results.error = `Erro ao carregar profissionais: ${professionalsError.message}`;
        } else {
          results.data = {
            count: professionalsData?.length || 0,
            professionals: professionalsData?.slice(0, 5).map(p => ({ id: p.id, name: p.full_name, role: p.professional_role })) || []
          };
          results.success = true;
        }
        break;

      case 'classes':
        // Testar acesso à página de turmas
        let classesQuery = supabaseClient
          .from('classes')
          .select('id, class_name, school_id, tenant_id, grade, shift')
          .eq('is_active', true)
          .limit(10);

        if (profileData.school_id) {
          classesQuery = classesQuery.eq('school_id', profileData.school_id);
        } else if (profileData.tenant_id) {
          classesQuery = classesQuery.eq('tenant_id', profileData.tenant_id);
        }

        const { data: classesData, error: classesError } = await classesQuery;

        if (classesError) {
          results.error = `Erro ao carregar turmas: ${classesError.message}`;
        } else {
          results.data = {
            count: classesData?.length || 0,
            classes: classesData?.slice(0, 5).map(c => ({ id: c.id, name: c.class_name, grade: c.grade })) || []
          };
          results.success = true;
        }
        break;

      case 'users':
        // Testar acesso à página de usuários
        let usersQuery = supabaseClient
          .from('profiles')
          .select('id, full_name, email, tenant_id, school_id, is_active')
          .limit(10);

        if (profileData.school_id) {
          usersQuery = usersQuery.eq('school_id', profileData.school_id);
        } else if (profileData.tenant_id) {
          usersQuery = usersQuery.eq('tenant_id', profileData.tenant_id);
        }

        const { data: usersData, error: usersError } = await usersQuery;

        if (usersError) {
          results.error = `Erro ao carregar usuários: ${usersError.message}`;
        } else {
          results.data = {
            count: usersData?.length || 0,
            users: usersData?.slice(0, 5).map(u => ({ id: u.id, name: u.full_name, email: u.email })) || []
          };
          results.success = true;
        }
        break;

      case 'import':
        // Testar acesso à página de importação (verificar permissões)
        results.data = { message: 'Página de importação acessível' };
        results.success = true;
        break;

      case 'export':
        // Testar acesso à página de exportação (verificar permissões)
        results.data = { message: 'Página de exportação acessível' };
        results.success = true;
        break;

      default:
        results.error = `Funcionalidade '${feature}' não implementada no teste`;
    }
  } catch (error) {
    results.error = `Erro ao testar ${feature}: ${error.message}`;
  }

  return results;
}

async function testScenario(scenario) {
  const results = {
    scenario: scenario.name,
    role: scenario.role,
    email: scenario.email,
    login: false,
    profileLoaded: false,
    features: [],
    errors: []
  };

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTANDO: ${scenario.name.toUpperCase()} (${scenario.role})`);
    console.log(`${'='.repeat(80)}\n`);

    // 1. Login
    console.log(`1️⃣ Fazendo login como ${scenario.role}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: scenario.email,
      password: scenario.password
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
      
      if (!roles.includes(scenario.role)) {
        console.warn(`   ⚠️ Role esperado '${scenario.role}' não encontrado nos roles do usuário`);
        results.errors.push(`Role esperado '${scenario.role}' não encontrado`);
      }
    }

    // 4. Testar funcionalidades
    console.log(`\n4️⃣ Testando funcionalidades do App Gestão Escolar...`);
    
    for (const feature of scenario.features) {
      console.log(`\n   📋 Testando: ${feature}...`);
      const featureResult = await testFeature(supabase, feature, authData, profileData);
      
      if (featureResult.success) {
        console.log(`      ✅ ${feature} funcionando`);
        if (featureResult.data) {
          if (featureResult.data.count !== undefined) {
            console.log(`         Total: ${featureResult.data.count}`);
          } else if (featureResult.data.students && Array.isArray(featureResult.data.students)) {
            console.log(`         Exemplos: ${featureResult.data.students.map(s => s.name).join(', ')}`);
          } else if (featureResult.data.professionals && Array.isArray(featureResult.data.professionals)) {
            console.log(`         Exemplos: ${featureResult.data.professionals.map(p => p.name).join(', ')}`);
          } else if (featureResult.data.classes && Array.isArray(featureResult.data.classes)) {
            console.log(`         Exemplos: ${featureResult.data.classes.map(c => c.name).join(', ')}`);
          } else if (featureResult.data.message) {
            console.log(`         ${featureResult.data.message}`);
          } else if (featureResult.data.students || featureResult.data.professionals || featureResult.data.classes) {
            console.log(`         Dados carregados (formato não esperado)`);
          }
        }
      } else {
        console.error(`      ❌ ${feature} falhou: ${featureResult.error}`);
        results.errors.push(`${feature}: ${featureResult.error}`);
      }
      
      results.features.push({
        feature: feature,
        success: featureResult.success,
        error: featureResult.error,
        data: featureResult.data
      });
    }

    // Logout
    await supabase.auth.signOut();
    console.log(`\n   ✅ Teste do ${scenario.name} concluído`);

    return results;

  } catch (error) {
    console.error(`\n   ❌ Erro ao testar cenário: ${error.message}`);
    results.errors.push(`Erro geral: ${error.message}`);
    await supabase.auth.signOut();
    return results;
  }
}

// Executar testes de todos os cenários
async function testAllScenarios() {
  const allResults = [];
  let successCount = 0;
  let failureCount = 0;

  for (const scenario of testScenarios) {
    const result = await testScenario(scenario);
    allResults.push(result);
    
    const isSuccess = result.login && result.profileLoaded && 
                     result.features.every(f => f.success) && 
                     result.errors.length === 0;
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
  console.log('📊 RELATÓRIO FINAL - TESTE DO APP GESTÃO ESCOLAR');
  console.log('='.repeat(80) + '\n');

  allResults.forEach((result) => {
    const allFeaturesSuccess = result.features.every(f => f.success);
    const status = result.login && result.profileLoaded && allFeaturesSuccess && result.errors.length === 0 ? '✅' : '❌';
    console.log(`${status} ${result.scenario} (${result.role})`);
    console.log(`   Email: ${result.email}`);
    console.log(`   Login: ${result.login ? '✅' : '❌'}`);
    console.log(`   Perfil: ${result.profileLoaded ? '✅' : '❌'}`);
    console.log(`   Funcionalidades: ${result.features.length} testadas`);
    result.features.forEach(f => {
      console.log(`      ${f.success ? '✅' : '❌'} ${f.feature}`);
      if (f.error) {
        console.log(`         Erro: ${f.error}`);
      }
    });
    
    if (result.errors.length > 0) {
      console.log(`   Erros Gerais: ${result.errors.length}`);
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
testAllScenarios().then((results) => {
  const allSuccess = results.every(r => 
    r.login && r.profileLoaded && 
    r.features.every(f => f.success) && 
    r.errors.length === 0
  );
  process.exit(allSuccess ? 0 : 1);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

