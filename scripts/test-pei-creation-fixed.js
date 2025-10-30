// Script para testar criação de PEI com tenant_id correto
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPEICreationFixed() {
  console.log('🔍 Testando criação de PEI com tenant_id correto...\n');

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

    // 2. Buscar dados do perfil da coordenadora
    console.log('\n2. Buscando perfil da coordenadora...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, school_id, tenant_id')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }

    console.log('✅ Perfil encontrado:', profile.full_name);
    console.log('   School ID:', profile.school_id);
    console.log('   Tenant ID:', profile.tenant_id);

    // 3. Buscar um aluno da escola
    console.log('\n3. Buscando aluno...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, school_id, tenant_id')
      .eq('school_id', profile.school_id)
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
    console.log('   Student School ID:', student.school_id);
    console.log('   Student Tenant ID:', student.tenant_id);

    // 4. Buscar um professor da escola
    console.log('\n4. Buscando professor...');
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, full_name, role, school_id, tenant_id')
      .eq('school_id', profile.school_id)
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
    console.log('   Teacher School ID:', teacher.school_id);
    console.log('   Teacher Tenant ID:', teacher.tenant_id);

    // 5. Verificar se os tenant_ids são consistentes
    console.log('\n5. Verificando consistência dos tenant_ids...');
    if (student.tenant_id !== teacher.tenant_id) {
      console.error('❌ Tenant IDs inconsistentes entre aluno e professor');
      return;
    }
    if (student.tenant_id !== profile.tenant_id) {
      console.error('❌ Tenant ID do aluno não confere com o perfil');
      return;
    }
    console.log('✅ Tenant IDs consistentes');

    // 6. Tentar criar PEI com tenant_id correto
    console.log('\n6. Criando PEI...');
    const { data: peiData, error: peiError } = await supabase
      .from('peis')
      .insert({
        student_id: student.id,
        school_id: student.school_id,
        tenant_id: student.tenant_id, // Usar o tenant_id do aluno
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
    console.log('   School ID:', peiData.school_id);
    console.log('   Tenant ID:', peiData.tenant_id);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  testPEICreationFixed();
}

export { testPEICreationFixed };

