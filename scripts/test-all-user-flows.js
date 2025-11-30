// Script completo para testar todos os fluxos de usuário
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Credenciais de teste
const TEST_USERS = {
  superadmin: { email: 'superadmin@teste.com', password: 'Teste123', role: 'superadmin' },
  coordenador: { email: 'coordenador@teste.com', password: 'Teste123', role: 'coordinator' },
  professor: { email: 'professor@teste.com', password: 'Teste123', role: 'teacher' },
  diretor: { email: 'gestor@teste.com', password: 'Teste123', role: 'school_manager' },
  secretario: { email: 'superadmin@teste.com', password: 'Teste123', role: 'education_secretary' }
};

// Função para testar login
async function testLogin(email, password, expectedRole) {
  console.log(`\n🔐 Testando login: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(`❌ Erro no login: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data.session) {
      console.error(`❌ Sessão não criada`);
      return { success: false, error: 'Sessão não criada' };
    }

    // Verificar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn(`⚠️ Erro ao buscar perfil: ${profileError.message}`);
    } else {
      console.log(`✅ Login bem-sucedido!`);
      console.log(`   Nome: ${profile.full_name}`);
      console.log(`   Role: ${profile.role || 'não definido'}`);
      console.log(`   Esperado: ${expectedRole}`);
    }

    return { success: true, session: data.session, profile };
  } catch (error) {
    console.error(`❌ Erro inesperado: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função para testar logout
async function testLogout() {
  console.log(`\n🚪 Testando logout...`);
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error(`❌ Erro no logout: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`✅ Logout bem-sucedido!`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erro inesperado: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função para criar dados de teste
async function createTestData() {
  console.log(`\n📝 Criando dados de teste...`);
  
  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const SCHOOL_ID = '00000000-0000-0000-0000-000000000002';

  try {
    // Verificar se já existe aluno
    const { data: existingStudents } = await supabase
      .from('students')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .limit(1);

    if (existingStudents && existingStudents.length > 0) {
      console.log(`✅ Alunos já existem no sistema`);
      return { success: true, hasData: true };
    }

    // Criar aluno de teste
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        id: '20000000-0000-0000-0000-000000000001',
        tenant_id: TENANT_ID,
        school_id: SCHOOL_ID,
        name: 'Aluno Teste PEI',
        date_of_birth: '2015-05-15',
        student_id: 'TEST001',
        class_name: '5º Ano A',
        is_active: true
      })
      .select()
      .single();

    if (studentError) {
      console.error(`❌ Erro ao criar aluno: ${studentError.message}`);
      return { success: false, error: studentError.message };
    }

    console.log(`✅ Aluno criado: ${student.name} (${student.id})`);

    // Verificar se há professor para criar PEI
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'teacher')
      .limit(1);

    if (teachers && teachers.length > 0) {
      // Criar PEI pendente para teste
      const { data: pei, error: peiError } = await supabase
        .from('peis')
        .insert({
          student_id: student.id,
          school_id: SCHOOL_ID,
          tenant_id: TENANT_ID,
          assigned_teacher_id: teachers[0].id,
          created_by: teachers[0].id,
          status: 'pending',
          version: 1
        })
        .select()
        .single();

      if (peiError) {
        console.warn(`⚠️ Erro ao criar PEI: ${peiError.message}`);
      } else {
        console.log(`✅ PEI criado: ${pei.id} (status: ${pei.status})`);
      }
    }

    return { success: true, hasData: true, student };
  } catch (error) {
    console.error(`❌ Erro inesperado: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTES DOS FLUXOS DE USUÁRIO - PEI COLLAB');
  console.log('🧪 ========================================\n');

  const results = {
    logins: [],
    logouts: [],
    testData: null
  };

  // 1. Criar dados de teste primeiro
  results.testData = await createTestData();

  // 2. Testar login/logout para cada perfil
  for (const [key, user] of Object.entries(TEST_USERS)) {
    // Login
    const loginResult = await testLogin(user.email, user.password, user.role);
    results.logins.push({ user: key, ...loginResult });

    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Logout
    const logoutResult = await testLogout();
    results.logouts.push({ user: key, ...logoutResult });

    // Aguardar antes do próximo ciclo
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 3. Relatório final
  console.log('\n📊 ========================================');
  console.log('📊 RELATÓRIO FINAL');
  console.log('📊 ========================================\n');

  console.log('🔐 Testes de Login:');
  results.logins.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`   ${icon} ${result.user}: ${result.success ? 'SUCESSO' : result.error}`);
  });

  console.log('\n🚪 Testes de Logout:');
  results.logouts.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`   ${icon} ${result.user}: ${result.success ? 'SUCESSO' : result.error}`);
  });

  console.log('\n📝 Dados de Teste:');
  if (results.testData?.success) {
    console.log(`   ✅ ${results.testData.hasData ? 'Dados disponíveis' : 'Dados criados'}`);
  } else {
    console.log(`   ❌ ${results.testData?.error || 'Erro desconhecido'}`);
  }

  const successCount = results.logins.filter(r => r.success).length;
  const totalCount = results.logins.length;

  console.log(`\n📈 Resultado: ${successCount}/${totalCount} logins bem-sucedidos`);

  return results;
}

// Executar testes
runAllTests().catch(console.error);

