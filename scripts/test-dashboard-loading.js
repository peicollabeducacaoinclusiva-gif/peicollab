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

async function testDashboardLoading() {
  console.log('🔍 Testando carregamento do dashboard...\n');
  
  try {
    // Simular o fluxo exato do dashboard
    console.log('1. Simulando loadSchoolStats...');
    
    // 1. Buscar usuário (simular auth.getUser())
    console.log('   - Buscando usuário atual...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('   ❌ Erro ao buscar usuário:', userError.message);
      console.log('   💡 Isso pode ser o problema! O usuário não está logado.');
      return;
    }
    
    if (!user) {
      console.log('   ❌ Nenhum usuário logado');
      console.log('   💡 Isso pode ser o problema! O usuário não está logado.');
      return;
    }
    
    console.log('   ✅ Usuário encontrado:', user.id, user.email);
    
    // 2. Buscar profile
    console.log('   - Buscando profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('   ❌ Erro ao buscar profile:', profileError.message);
      return;
    }
    
    if (!profile?.school_id) {
      console.log('   ❌ Usuário não tem school_id definido');
      return;
    }
    
    console.log('   ✅ Profile encontrado, school_id:', profile.school_id);
    
    // 3. Buscar dados da escola
    console.log('   - Buscando dados da escola...');
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id,
        school_name,
        profiles:profiles(count),
        students:students(count),
        peis:peis(count)
      `)
      .eq('id', profile.school_id)
      .single();
    
    if (schoolError) {
      console.log('   ❌ Erro ao buscar dados da escola:', schoolError.message);
      return;
    }
    
    console.log('   ✅ Dados da escola:', schoolData);
    
    // 4. Buscar alunos
    console.log('   - Buscando alunos...');
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        name,
        school_id,
        tenant_id,
        created_at
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (studentsError) {
      console.log('   ❌ Erro ao buscar alunos:', studentsError.message);
      return;
    }
    
    console.log(`   ✅ Alunos encontrados: ${studentsData?.length || 0}`);
    studentsData?.forEach((student, index) => {
      console.log(`      ${index + 1}. ${student.name}`);
    });
    
    console.log('\n🎉 SUCESSO! O dashboard deve funcionar corretamente.');
    console.log('💡 Se os alunos não aparecem na interface, o problema pode estar em:');
    console.log('   1. Estado de loading não sendo atualizado');
    console.log('   2. Componente não sendo re-renderizado');
    console.log('   3. Problema na autenticação do usuário');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testDashboardLoading();


