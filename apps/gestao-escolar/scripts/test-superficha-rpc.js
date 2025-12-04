/**
 * Script para testar os endpoints RPC da Superficha
 * Execute com: node scripts/test-superficha-rpc.js
 * 
 * Requisitos:
 * - Node.js 18+
 * - Variáveis de ambiente configuradas (.env.local)
 */

// Para uso com CommonJS (mais compatível)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para imprimir resultados
function printResult(testName, success, data, error) {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 Teste: ${testName}`);
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✅ SUCESSO');
    if (data) {
      console.log('📊 Dados retornados:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    }
  } else {
    console.log('❌ ERRO');
    if (error) {
      console.log('💥 Mensagem de erro:', error.message);
      console.log('📋 Detalhes:', error.details || error.hint || 'N/A');
    }
  }
}

// Função para buscar um estudante de teste
async function getTestStudentId() {
  console.log('\n🔍 Buscando estudante de teste...');
  const { data, error } = await supabase
    .from('students')
    .select('id, name')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar estudante:', error);
    return null;
  }

  console.log(`✅ Estudante encontrado: ${data.name} (ID: ${data.id})`);
  return data.id;
}

// Teste 1: get_student_complete_profile
async function testCompleteProfile(studentId) {
  const { data, error } = await supabase.rpc('get_student_complete_profile', {
    p_student_id: studentId,
  });

  printResult(
    'get_student_complete_profile',
    !error,
    data,
    error
  );

  return { success: !error, data, error };
}

// Teste 2: get_student_risk_indicators
async function testRiskIndicators(studentId) {
  const { data, error } = await supabase.rpc('get_student_risk_indicators', {
    p_student_id: studentId,
  });

  printResult(
    'get_student_risk_indicators',
    !error,
    data,
    error
  );

  return { success: !error, data, error };
}

// Teste 3: get_student_suggestions
async function testSuggestions(studentId) {
  const { data, error } = await supabase.rpc('get_student_suggestions', {
    p_student_id: studentId,
  });

  printResult(
    'get_student_suggestions',
    !error,
    data,
    error
  );

  return { success: !error, data, error };
}

// Teste 4: get_student_activity_timeline
async function testActivityTimeline(studentId) {
  const { data, error } = await supabase.rpc('get_student_activity_timeline', {
    p_student_id: studentId,
    p_limit: 10,
  });

  printResult(
    'get_student_activity_timeline',
    !error,
    data,
    error
  );

  return { success: !error, data, error };
}

// Teste 5: update_student_field (apenas verificar se a função existe)
async function testUpdateFieldExists() {
  // Verificar se a função existe consultando o sistema
  const { data, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'update_student_field';
      `,
    });

  const exists = !error && data && data.length > 0;

  printResult(
    'update_student_field (verificação de existência)',
    exists,
    exists ? 'Função encontrada' : null,
    exists ? null : { message: 'Função não encontrada no banco' }
  );

  return { success: exists };
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes dos endpoints RPC da Superficha\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  // Buscar estudante de teste
  const studentId = await getTestStudentId();

  if (!studentId) {
    console.error('\n❌ Não foi possível encontrar um estudante para teste.');
    console.log('💡 Certifique-se de que existem estudantes no banco de dados.');
    process.exit(1);
  }

  // Executar testes
  const results = {
    completeProfile: await testCompleteProfile(studentId),
    riskIndicators: await testRiskIndicators(studentId),
    suggestions: await testSuggestions(studentId),
    activityTimeline: await testActivityTimeline(studentId),
    updateFieldExists: await testUpdateFieldExists(),
  };

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r.success).length;

  console.log(`✅ Passou: ${passed}/${total}`);
  console.log(`❌ Falhou: ${total - passed}/${total}`);

  Object.entries(results).forEach(([test, result]) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${test}`);
  });

  if (passed === total) {
    console.log('\n🎉 Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
    process.exit(1);
  }
}

// Executar testes
runTests().catch(error => {
  console.error('\n💥 Erro fatal ao executar testes:', error);
  process.exit(1);
});

