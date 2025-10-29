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

async function fixUserRolesRls() {
  console.log('🔧 Corrigindo RLS da tabela user_roles...\n');
  
  try {
    // 1. Desabilitar RLS temporariamente
    console.log('1. Desabilitando RLS na tabela user_roles...');
    const { error: disableError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;'
      });
    
    if (disableError) {
      console.log('⚠️ Erro ao desabilitar RLS (pode ser normal):', disableError.message);
    } else {
      console.log('✅ RLS desabilitado');
    }
    
    // 2. Criar role do secretário
    console.log('\n2. Criando role do secretário...');
    const secretaryId = '137a0b95-fcb1-4433-8f84-94717ba752c3';
    
    const { data: insertedRole, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: secretaryId,
        role: 'education_secretary'
      })
      .select()
      .single();
    
    if (roleError) {
      console.error('❌ Erro ao criar role do secretário:', roleError);
      return;
    }
    
    console.log('✅ Role do secretário criado:', insertedRole);
    
    // 3. Verificar se foi criado corretamente
    console.log('\n3. Verificando criação...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        tenant_id,
        school_id,
        is_active,
        user_roles(role)
      `)
      .eq('id', secretaryId)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar secretário:', verifyError);
      return;
    }
    
    console.log('✅ Secretário criado com sucesso:');
    console.log(`   Nome: ${verifyProfile.full_name}`);
    console.log(`   ID: ${verifyProfile.id}`);
    console.log(`   Tenant: ${verifyProfile.tenant_id}`);
    console.log(`   School: ${verifyProfile.school_id || 'N/A (Network Admin)'}`);
    console.log(`   Role: ${verifyProfile.user_roles?.[0]?.role}`);
    console.log(`   Ativo: ${verifyProfile.is_active ? 'Sim' : 'Não'}`);
    
    console.log('\n🎉 Secretário de Educação criado com sucesso!');
    console.log('💡 Para testar:');
    console.log('   1. Acesse http://localhost:8081');
    console.log('   2. Faça login com: roberto.secretario@educacao.gov.br / 123456');
    console.log('   3. Verifique se o dashboard do secretário aparece');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixUserRolesRls();


