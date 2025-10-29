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

async function debugDashboard() {
  console.log('🔍 Debug do Dashboard - Simulando login do School Director...\n');
  
  try {
    // 1. Simular login do school_director (Carlos Gestor Escolar)
    const userId = '44444444-4444-4444-4444-444444444444';
    
    console.log('1. Buscando profile do usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, school_id, tenant_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
      return;
    }
    
    console.log('✅ Profile encontrado:', profile);
    const schoolId = profile.school_id;
    
    if (!schoolId) {
      console.error('❌ Usuário não tem school_id definido');
      return;
    }
    
    console.log('🏫 School ID:', schoolId);
    
    // 2. Buscar dados da escola (query exata do dashboard)
    console.log('\n2. Buscando dados da escola...');
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id,
        school_name,
        profiles:profiles(count),
        students:students(count),
        peis:peis(count)
      `)
      .eq('id', schoolId)
      .single();
    
    if (schoolError) {
      console.error('❌ Erro ao buscar dados da escola:', schoolError);
    } else {
      console.log('✅ Dados da escola:', schoolData);
      console.log(`   - Nome: ${schoolData.school_name}`);
      console.log(`   - Professores: ${schoolData.profiles?.[0]?.count || 0}`);
      console.log(`   - Alunos: ${schoolData.students?.[0]?.count || 0}`);
      console.log(`   - PEIs: ${schoolData.peis?.[0]?.count || 0}`);
    }
    
    // 3. Buscar alunos (query exata do dashboard)
    console.log('\n3. Buscando alunos...');
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        name,
        school_id,
        tenant_id,
        created_at
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (studentsError) {
      console.error('❌ Erro ao buscar alunos:', studentsError);
    } else {
      console.log(`✅ Alunos encontrados: ${studentsData?.length || 0}`);
      studentsData?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (ID: ${student.id})`);
        console.log(`      School: ${student.school_id}`);
        console.log(`      Criado: ${new Date(student.created_at).toLocaleString('pt-BR')}`);
      });
    }
    
    // 4. Verificar se há problemas de RLS
    console.log('\n4. Testando RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('students')
      .select('count')
      .eq('school_id', schoolId);
    
    if (rlsError) {
      console.error('❌ Erro de RLS:', rlsError);
    } else {
      console.log('✅ RLS OK, count:', rlsTest);
    }
    
    // 5. Verificar todos os alunos no banco
    console.log('\n5. Verificando todos os alunos no banco...');
    const { data: allStudents, error: allError } = await supabase
      .from('students')
      .select('id, name, school_id, tenant_id, created_at')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os alunos:', allError);
    } else {
      console.log(`📊 Total de alunos no banco: ${allStudents?.length || 0}`);
      allStudents?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name}`);
        console.log(`      School: ${student.school_id}`);
        console.log(`      Tenant: ${student.tenant_id}`);
        console.log(`      Criado: ${new Date(student.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugDashboard();


