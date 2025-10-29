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

async function createSecretaryExistingId() {
  console.log('🏛️ Criando Secretário de Educação (usando ID existente)...\n');
  
  try {
    // 1. Verificar IDs existentes
    console.log('1. Verificando IDs existentes na tabela profiles...');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }
    
    console.log('✅ Profiles existentes:');
    existingProfiles?.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.full_name} (ID: ${profile.id}) - Role: ${profile.role}`);
    });
    
    // 2. Usar um ID existente para criar o secretário
    const existingId = existingProfiles?.[0]?.id;
    if (!existingId) {
      console.error('❌ Nenhum ID existente encontrado');
      return;
    }
    
    console.log(`\n2. Usando ID existente: ${existingId}`);
    
    // 3. Verificar se já existe um secretário
    console.log('\n3. Verificando se já existe secretário...');
    const { data: existingSecretary, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name, role, school_id')
      .eq('role', 'school_manager')
      .is('school_id', null)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar secretário:', checkError);
      return;
    }
    
    if (existingSecretary) {
      console.log('✅ Secretário já existe:', existingSecretary);
      return;
    }
    
    console.log('ℹ️ Secretário não encontrado, criando novo...');
    
    // 4. Verificar tenant
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, network_name')
      .limit(1);
    
    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError);
      return;
    }
    
    const tenantId = tenants?.[0]?.id;
    if (!tenantId) {
      console.error('❌ Nenhum tenant encontrado');
      return;
    }
    
    console.log(`✅ Usando tenant: ${tenants?.[0]?.network_name} (ID: ${tenantId})`);
    
    // 5. Criar novo profile para o secretário
    console.log('\n4. Criando profile do secretário...');
    const secretaryData = {
      id: '99999999-9999-9999-9999-999999999999', // Novo ID único
      full_name: 'Dr. Roberto Secretário de Educação',
      tenant_id: tenantId,
      school_id: null, // Secretário não está vinculado a uma escola específica
      role: 'school_manager', // Usar role válido que representa administrador de rede
      is_active: true
    };
    
    const { data: insertedProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(secretaryData)
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao criar profile:', profileError);
      console.log('💡 Tentando usar ID existente...');
      
      // Tentar usar ID existente
      const secretaryDataExisting = {
        id: existingId,
        full_name: 'Dr. Roberto Secretário de Educação',
        tenant_id: tenantId,
        school_id: null,
        role: 'school_manager',
        is_active: true
      };
      
      const { data: insertedProfileExisting, error: profileErrorExisting } = await supabase
        .from('profiles')
        .insert(secretaryDataExisting)
        .select()
        .single();
      
      if (profileErrorExisting) {
        console.error('❌ Erro ao criar profile com ID existente:', profileErrorExisting);
        return;
      }
      
      console.log('✅ Profile criado com ID existente:', insertedProfileExisting);
    } else {
      console.log('✅ Profile criado:', insertedProfile);
    }
    
    // 6. Verificar resultado final
    console.log('\n5. Verificando resultado final...');
    const { data: finalProfile, error: finalProfileError } = await supabase
      .from('profiles')
      .select('id, full_name, tenant_id, school_id, role, is_active')
      .eq('role', 'school_manager')
      .is('school_id', null)
      .single();
    
    if (finalProfileError) {
      console.error('❌ Erro ao verificar profile final:', finalProfileError);
      return;
    }
    
    console.log('✅ Secretário de Educação criado com sucesso:');
    console.log(`   Nome: ${finalProfile.full_name}`);
    console.log(`   ID: ${finalProfile.id}`);
    console.log(`   Tenant: ${finalProfile.tenant_id}`);
    console.log(`   School: ${finalProfile.school_id || 'N/A (Network Admin)'}`);
    console.log(`   Role: ${finalProfile.role}`);
    console.log(`   Ativo: ${finalProfile.is_active ? 'Sim' : 'Não'}`);
    
    console.log('\n🎉 Secretário de Educação criado com sucesso!');
    console.log('💡 Para testar:');
    console.log('   1. Acesse http://localhost:8081');
    console.log('   2. Faça login com o ID do secretário');
    console.log('   3. Verifique se o dashboard do secretário aparece');
    console.log('   4. O role "school_manager" representa um administrador de rede/secretário');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSecretaryExistingId();
