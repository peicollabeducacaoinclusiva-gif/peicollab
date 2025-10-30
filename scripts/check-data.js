// Script para verificar dados no banco
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('🔍 Verificando dados no banco...\n');
  
  // Verificar alunos
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, school_id')
    .eq('school_id', '00000000-0000-0000-0000-000000000002');
  
  if (studentsError) {
    console.error('❌ Erro ao buscar alunos:', studentsError);
  } else {
    console.log('✅ Alunos encontrados:', students?.length || 0);
    students?.forEach(s => console.log('  -', s.name, '(ID:', s.id, ')'));
  }
  
  // Verificar professores
  const { data: teachers, error: teachersError } = await supabase
    .from('profiles')
    .select('id, full_name, school_id, role')
    .eq('school_id', '00000000-0000-0000-0000-000000000002')
    .in('role', ['teacher', 'aee_teacher', 'coordinator']);
  
  if (teachersError) {
    console.error('❌ Erro ao buscar professores:', teachersError);
  } else {
    console.log('\n✅ Professores encontrados:', teachers?.length || 0);
    teachers?.forEach(t => console.log('  -', t.full_name, '(' + t.role + ')'));
  }
  
  // Verificar se há RLS ativo
  console.log('\n🔍 Verificando RLS...');
  const { data: rlsInfo, error: rlsError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename IN ('students', 'profiles') 
        AND schemaname = 'public';
      `
    });
  
  if (rlsError) {
    console.log('⚠️ Não foi possível verificar RLS:', rlsError.message);
  } else {
    console.log('📊 Status RLS:', rlsInfo);
  }
}

checkData();

