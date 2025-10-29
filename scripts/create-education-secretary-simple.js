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

async function createEducationSecretarySimple() {
  console.log('🏛️ Criando usuário do Secretário de Educação (método simples)...\n');
  
  try {
    // 1. Verificar se já existe um secretário de educação
    console.log('1. Verificando se já existe secretário de educação...');
    const { data: existingSecretary, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', '88888888-8888-8888-8888-888888888888')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar secretário existente:', checkError);
      return;
    }
    
    if (existingSecretary) {
      console.log('✅ Secretário de educação já existe:', existingSecretary);
      return;
    }
    
    console.log('ℹ️ Secretário não encontrado, criando novo...');
    
    // 2. Verificar se existe um tenant (rede) para o secretário
    console.log('\n2. Verificando tenants disponíveis...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, network_name')
      .limit(5);
    
    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError);
      return;
    }
    
    console.log(`✅ Encontrados ${tenants?.length || 0} tenants:`);
    tenants?.forEach((tenant, index) => {
      console.log(`   ${index + 1}. ${tenant.network_name} (ID: ${tenant.id})`);
    });
    
    const tenantId = tenants?.[0]?.id;
    if (!tenantId) {
      console.error('❌ Nenhum tenant encontrado. Crie um tenant primeiro.');
      return;
    }
    
    console.log(`✅ Usando tenant: ${tenants?.[0]?.network_name} (ID: ${tenantId})`);
    
    // 3. Usar um ID existente ou criar um novo usando auth
    console.log('\n3. Criando usuário usando Supabase Auth...');
    
    // Tentar criar usuário usando auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'roberto.secretario@educacao.gov.br',
      password: '123456',
      options: {
        data: {
          full_name: 'Dr. Roberto Secretário de Educação'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário na auth:', authError);
      return;
    }
    
    const secretaryId = authData.user?.id;
    if (!secretaryId) {
      console.error('❌ ID do usuário não foi retornado');
      return;
    }
    
    console.log('✅ Usuário criado na auth.users:', secretaryId);
    
    // 4. Criar o profile do secretário
    console.log('\n4. Criando profile do secretário...');
    const secretaryData = {
      id: secretaryId,
      full_name: 'Dr. Roberto Secretário de Educação',
      tenant_id: tenantId,
      school_id: null, // Secretário não está vinculado a uma escola específica
      is_active: true
    };
    
    const { data: insertedProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(secretaryData)
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao criar profile do secretário:', profileError);
      return;
    }
    
    console.log('✅ Profile do secretário criado:', insertedProfile);
    
    // 5. Criar role do secretário
    console.log('\n5. Criando role do secretário...');
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
    
    // 6. Verificar se foi criado corretamente
    console.log('\n6. Verificando criação...');
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

createEducationSecretarySimple();


