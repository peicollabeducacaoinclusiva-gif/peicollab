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

async function checkUserLogin() {
  console.log('🔍 Verificando usuários disponíveis para login...\n');
  
  try {
    // 1. Verificar todos os profiles disponíveis
    console.log('1. Buscando todos os profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, school_id, tenant_id')
      .not('school_id', 'is', null);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }
    
    console.log(`✅ Encontrados ${profiles?.length || 0} profiles com school_id:`);
    profiles?.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.full_name} (ID: ${profile.id})`);
      console.log(`      School ID: ${profile.school_id}`);
      console.log(`      Tenant ID: ${profile.tenant_id}`);
      console.log('');
    });
    
    // 2. Verificar se há usuários de teste
    console.log('2. Verificando usuários de teste...');
    const testUsers = [
      { id: '44444444-4444-4444-4444-444444444444', name: 'Carlos Gestor Escolar' },
      { id: '11111111-1111-1111-1111-111111111111', name: 'Super Admin Sistema' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Maria Coordenadora' }
    ];
    
    for (const testUser of testUsers) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, school_id, tenant_id')
        .eq('id', testUser.id)
        .single();
      
      if (profileError) {
        console.log(`❌ ${testUser.name}: ${profileError.message}`);
      } else {
        console.log(`✅ ${testUser.name}:`);
        console.log(`   School ID: ${profile.school_id}`);
        console.log(`   Tenant ID: ${profile.tenant_id}`);
        
        if (profile.school_id) {
          // Verificar alunos desta escola
          const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, name, school_id')
            .eq('school_id', profile.school_id);
          
          if (studentsError) {
            console.log(`   ❌ Erro ao buscar alunos: ${studentsError.message}`);
          } else {
            console.log(`   👥 Alunos: ${students?.length || 0}`);
            students?.forEach((student, index) => {
              console.log(`      ${index + 1}. ${student.name}`);
            });
          }
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserLogin();


