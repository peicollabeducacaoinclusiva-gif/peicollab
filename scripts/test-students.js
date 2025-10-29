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

async function testStudents() {
  console.log('🔍 Testando dados de alunos...\n');
  
  try {
    // 1. Verificar todos os alunos
    console.log('1. Todos os alunos no banco:');
    const { data: allStudents, error: allError } = await supabase
      .from('students')
      .select('id, name, school_id, tenant_id, created_at')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os alunos:', allError);
    } else {
      console.log(`✅ Encontrados ${allStudents?.length || 0} alunos:`);
      allStudents?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (ID: ${student.id})`);
        console.log(`      School ID: ${student.school_id}`);
        console.log(`      Tenant ID: ${student.tenant_id}`);
        console.log(`      Criado em: ${student.created_at}`);
        console.log('');
      });
    }

    // 2. Verificar escolas
    console.log('2. Escolas disponíveis:');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, school_name, tenant_id');
    
    if (schoolsError) {
      console.error('❌ Erro ao buscar escolas:', schoolsError);
    } else {
      console.log(`✅ Encontradas ${schools?.length || 0} escolas:`);
      schools?.forEach((school, index) => {
        console.log(`   ${index + 1}. ${school.school_name} (ID: ${school.id})`);
        console.log(`      Tenant ID: ${school.tenant_id}`);
        console.log('');
      });
    }

    // 3. Verificar profiles de school_director
    console.log('3. Profiles de school_director:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, school_id, tenant_id')
      .not('school_id', 'is', null);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
    } else {
      console.log(`✅ Encontrados ${profiles?.length || 0} profiles com school_id:`);
      profiles?.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name} (ID: ${profile.id})`);
        console.log(`      School ID: ${profile.school_id}`);
        console.log(`      Tenant ID: ${profile.tenant_id}`);
        console.log('');
      });
    }

    // 4. Testar inserção de aluno de teste
    console.log('4. Testando inserção de aluno...');
    const testStudent = {
      name: 'Aluno Teste - ' + new Date().toISOString(),
      school_id: schools?.[0]?.id,
      tenant_id: schools?.[0]?.tenant_id
    };
    
    console.log('Dados do aluno de teste:', testStudent);
    
    const { data: insertedStudent, error: insertError } = await supabase
      .from('students')
      .insert(testStudent)
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir aluno de teste:', insertError);
    } else {
      console.log('✅ Aluno de teste inserido com sucesso:', insertedStudent);
      
      // Verificar se aparece na consulta
      const { data: testQuery, error: testQueryError } = await supabase
        .from('students')
        .select('id, name, school_id, tenant_id')
        .eq('school_id', testStudent.school_id);
      
      if (testQueryError) {
        console.error('❌ Erro na consulta de teste:', testQueryError);
      } else {
        console.log('✅ Consulta de teste retornou:', testQuery);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testStudents();


