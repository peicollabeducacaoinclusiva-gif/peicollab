// Script para testar criação de PEI
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPEICreation() {
  console.log('🔍 Testando criação de PEI...\n');

  try {
    // 1. Fazer login como coordenadora
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

    // 2. Buscar um aluno
    console.log('\n2. Buscando aluno...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, school_id, tenant_id')
      .eq('school_id', '00000000-0000-0000-0000-000000000002')
      .limit(1);

    if (studentsError) {
      console.error('❌ Erro ao buscar aluno:', studentsError);
      return;
    }

    if (!students || students.length === 0) {
      console.error('❌ Nenhum aluno encontrado');
      return;
    }

    const student = students[0];
    console.log('✅ Aluno encontrado:', student.name);

    // 3. Buscar um professor
    console.log('\n3. Buscando professor...');
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('school_id', '00000000-0000-0000-0000-000000000002')
      .in('role', ['teacher', 'aee_teacher'])
      .limit(1);

    if (teachersError) {
      console.error('❌ Erro ao buscar professor:', teachersError);
      return;
    }

    if (!teachers || teachers.length === 0) {
      console.error('❌ Nenhum professor encontrado');
      return;
    }

    const teacher = teachers[0];
    console.log('✅ Professor encontrado:', teacher.full_name);

    // 4. Tentar criar PEI
    console.log('\n4. Criando PEI...');
    const { data: peiData, error: peiError } = await supabase
      .from('peis')
      .insert({
        student_id: student.id,
        school_id: student.school_id,
        tenant_id: student.tenant_id,
        created_by: authData.user.id,
        assigned_teacher_id: teacher.id,
        status: 'draft',
        diagnosis_data: {},
        planning_data: {},
        evaluation_data: {},
      })
      .select()
      .single();

    if (peiError) {
      console.error('❌ Erro ao criar PEI:', peiError);
      return;
    }

    console.log('✅ PEI criado com sucesso!');
    console.log('   ID:', peiData.id);
    console.log('   Status:', peiData.status);
    console.log('   Aluno:', student.name);
    console.log('   Professor:', teacher.full_name);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  testPEICreation();
}

export { testPEICreation };

