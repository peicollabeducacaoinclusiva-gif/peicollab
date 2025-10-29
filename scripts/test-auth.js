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

async function testAuth() {
  console.log('🔐 Testando autenticação e carregamento de dados...\n');
  
  try {
    // 1. Verificar se há usuários logados
    console.log('1. Verificando sessão atual...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
    } else if (user) {
      console.log('✅ Usuário logado:', user.id, user.email);
    } else {
      console.log('⚠️ Nenhum usuário logado');
    }
    
    // 2. Simular login do school_director
    console.log('\n2. Simulando login do school_director...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'carlos.gestor@escola.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
    } else {
      console.log('✅ Login realizado:', authData.user?.id);
      
      // 3. Buscar profile do usuário logado
      console.log('\n3. Buscando profile do usuário logado...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, school_id, tenant_id')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao buscar profile:', profileError);
      } else {
        console.log('✅ Profile encontrado:', profile);
        
        const schoolId = profile.school_id;
        if (!schoolId) {
          console.error('❌ Usuário não tem school_id definido');
          return;
        }
        
        // 4. Buscar alunos com o usuário logado
        console.log('\n4. Buscando alunos com usuário autenticado...');
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
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAuth();


