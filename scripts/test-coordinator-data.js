// Script para testar carregamento de dados da coordenadora
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCoordinatorData() {
  console.log('🔍 Testando carregamento de dados da coordenadora...\n');

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

    // 2. Testar busca de alunos diretamente
    console.log('\n2. Testando busca de alunos...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, school_id')
      .eq('school_id', '00000000-0000-0000-0000-000000000002');

    if (studentsError) {
      console.error('❌ Erro ao buscar alunos:', studentsError);
    } else {
      console.log('✅ Alunos encontrados:', students?.length || 0);
      students?.forEach(s => console.log('  -', s.name));
    }

    // 3. Testar busca de professores
    console.log('\n3. Testando busca de professores...');
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, full_name, school_id, role')
      .eq('school_id', '00000000-0000-0000-0000-000000000002')
      .in('role', ['teacher', 'aee_teacher']);

    if (teachersError) {
      console.error('❌ Erro ao buscar professores:', teachersError);
    } else {
      console.log('✅ Professores encontrados:', teachers?.length || 0);
      teachers?.forEach(t => console.log('  -', t.full_name, '(' + t.role + ')'));
    }

    // 4. Testar função RPC para buscar alunos da escola
    console.log('\n4. Testando função RPC para alunos...');
    const { data: rpcStudents, error: rpcError } = await supabase
      .rpc('get_school_students', { 
        school_id: '00000000-0000-0000-0000-000000000002' 
      });

    if (rpcError) {
      console.error('❌ Erro na RPC get_school_students:', rpcError);
    } else {
      console.log('✅ Alunos via RPC:', rpcStudents?.length || 0);
    }

    // 5. Testar função RPC para buscar professores da escola
    console.log('\n5. Testando função RPC para professores...');
    const { data: rpcTeachers, error: rpcTeachersError } = await supabase
      .rpc('get_school_teachers', { 
        school_id: '00000000-0000-0000-0000-000000000002' 
      });

    if (rpcTeachersError) {
      console.error('❌ Erro na RPC get_school_teachers:', rpcTeachersError);
    } else {
      console.log('✅ Professores via RPC:', rpcTeachers?.length || 0);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  testCoordinatorData();
}

export { testCoordinatorData };

