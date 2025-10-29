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

async function checkProfilesCurrent() {
  console.log('🔍 Verificando estrutura atual da tabela profiles...\n');
  
  try {
    // 1. Verificar estrutura da tabela profiles
    console.log('1. Buscando estrutura da tabela profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Estrutura atual da tabela profiles:');
      const profile = profiles[0];
      Object.keys(profile).forEach(key => {
        console.log(`   - ${key}: ${typeof profile[key]} (${profile[key]})`);
      });
    } else {
      console.log('⚠️ Nenhum profile encontrado');
    }
    
    // 2. Verificar se existe coluna role
    console.log('\n2. Verificando se existe coluna role...');
    const { data: roleTest, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);
    
    if (roleError) {
      console.log('❌ Coluna role não existe:', roleError.message);
    } else {
      console.log('✅ Coluna role existe');
    }
    
    // 3. Verificar se existe coluna email
    console.log('\n3. Verificando se existe coluna email...');
    const { data: emailTest, error: emailError } = await supabase
      .from('profiles')
      .select('email')
      .limit(1);
    
    if (emailError) {
      console.log('❌ Coluna email não existe:', emailError.message);
    } else {
      console.log('✅ Coluna email existe');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkProfilesCurrent();


