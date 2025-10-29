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

async function testFinal() {
  console.log('🎯 Teste Final - Verificando se alunos aparecem no dashboard...\n');
  
  try {
    const schoolId = '00000000-0000-0000-0000-000000000002';
    
    // Query exata do dashboard (simplificada)
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
      return;
    }
    
    console.log(`✅ Query do dashboard funcionando!`);
    console.log(`📊 Encontrados ${studentsData?.length || 0} alunos:`);
    
    studentsData?.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name}`);
      console.log(`      ID: ${student.id}`);
      console.log(`      School: ${student.school_id}`);
      console.log(`      Criado: ${new Date(student.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    if (studentsData && studentsData.length > 0) {
      console.log('🎉 SUCESSO! Os alunos devem aparecer no dashboard do School Director!');
    } else {
      console.log('⚠️ Nenhum aluno encontrado. Verifique se há alunos cadastrados.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFinal();


