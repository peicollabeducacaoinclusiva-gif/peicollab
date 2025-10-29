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
  console.log('⚠️ Arquivo .env não encontrado, usando variáveis do sistema');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSchoolDirector() {
  console.log('🔍 Testando dados do School Director...\n');
  
  try {
    // 1. Buscar profile do school_director (Carlos Gestor Escolar)
    const schoolDirectorId = '44444444-4444-4444-4444-444444444444';
    
    console.log('1. Buscando profile do school_director...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, school_id, tenant_id')
      .eq('id', schoolDirectorId)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
      return;
    }
    
    console.log('✅ Profile encontrado:', profile);
    const schoolId = profile.school_id;
    
    if (!schoolId) {
      console.error('❌ School Director não tem school_id definido');
      return;
    }
    
    console.log('🏫 School ID:', schoolId);
    
    // 2. Buscar dados da escola
    console.log('\n2. Buscando dados da escola...');
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id,
        school_name,
        students:students(count)
      `)
      .eq('id', schoolId)
      .single();
    
    if (schoolError) {
      console.error('❌ Erro ao buscar dados da escola:', schoolError);
    } else {
      console.log('✅ Dados da escola:', schoolData);
    }
    
    // 3. Buscar alunos da escola (query exata do dashboard)
    console.log('\n3. Buscando alunos da escola...');
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        name,
        peis:peis(
          id,
          status,
          created_by,
          profiles:profiles(full_name)
        )
      `)
      .eq('school_id', schoolId)
      .limit(20);
    
    if (studentsError) {
      console.error('❌ Erro ao buscar alunos:', studentsError);
    } else {
      console.log(`✅ Encontrados ${studentsData?.length || 0} alunos:`);
      studentsData?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (ID: ${student.id})`);
        if (student.peis && student.peis.length > 0) {
          console.log(`      PEIs: ${student.peis.length}`);
        } else {
          console.log(`      Sem PEIs`);
        }
      });
    }
    
    // 4. Buscar alunos simples (sem joins)
    console.log('\n4. Buscando alunos simples...');
    const { data: simpleStudents, error: simpleError } = await supabase
      .from('students')
      .select('id, name, school_id, tenant_id')
      .eq('school_id', schoolId);
    
    if (simpleError) {
      console.error('❌ Erro ao buscar alunos simples:', simpleError);
    } else {
      console.log(`✅ Alunos simples encontrados: ${simpleStudents?.length || 0}`);
      simpleStudents?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (School: ${student.school_id})`);
      });
    }
    
    // 5. Verificar se há problemas de RLS
    console.log('\n5. Testando RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('students')
      .select('count')
      .eq('school_id', schoolId);
    
    if (rlsError) {
      console.error('❌ Erro de RLS:', rlsError);
    } else {
      console.log('✅ RLS OK, count:', rlsTest);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSchoolDirector();


